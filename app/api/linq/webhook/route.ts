import { NextResponse } from "next/server";
import { getJobByChatId, updateJob } from "@/db/jobs";
import { getPaymentByJobId } from "@/db/payments";
import { upsertUserByPhone } from "@/db/users";
import { runAgentTurn, settlePayment } from "@/libs/agent";
import {
  isLinqConfigured,
  parseInboundMessage,
  retrieveLocation,
} from "@/libs/linq";
import { FUNDED_VIA } from "@/utils/schema/job";
import { PAYMENT_STATUS } from "@/utils/schema/payment";
import { USER_ROLE } from "@/utils/schema/user";
import { isSupabaseAdminConfigured } from "@/utils/supabase/admin";

/**
 * Inbound Linq webhook. Single live path: parse text/reaction → `runAgentTurn`
 * (Cascade triage → AI / peer / Terac expert). Also handles Agent Pay settle
 * and location.sharing events when present.
 */
export async function POST(request: Request) {
  if (!isLinqConfigured()) {
    return NextResponse.json(
      { error: "Linq is not configured. Set LINQ_API_V3_API_KEY." },
      { status: 503 }
    );
  }
  if (!isSupabaseAdminConfigured()) {
    return NextResponse.json(
      {
        error:
          "Supabase admin is not configured. Set SUPABASE_SERVICE_ROLE_KEY.",
      },
      { status: 503 }
    );
  }

  const body = await request.text();
  const headers = Object.fromEntries(request.headers.entries());

  try {
    const raw = JSON.parse(body) as {
      event_type?: string;
      data?: Record<string, unknown>;
    };

    if (raw.event_type === "payment.succeeded") {
      const settled = await handleAgentPaySucceeded(raw.data ?? {});
      return NextResponse.json({ ok: true, agentPay: settled });
    }

    if (
      raw.event_type === "location.sharing.started" ||
      raw.event_type === "location.sharing.updated" ||
      raw.event_type === "location.sharing.stopped"
    ) {
      if (raw.event_type !== "location.sharing.stopped") {
        await handleLocationShare(raw.data ?? {});
      }
      return NextResponse.json({ ok: true, location: true });
    }
  } catch {
    // fall through to normal inbound parse
  }

  let inbound;
  try {
    inbound = parseInboundMessage(body, headers);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Invalid webhook payload";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  if (!inbound) {
    return NextResponse.json({ ok: true, ignored: true });
  }

  try {
    const result = await runAgentTurn(inbound);
    return NextResponse.json({
      ok: true,
      action: result.action,
      jobId: result.jobId,
    });
  } catch (error) {
    // 200 so Linq doesn't retry: the inbound message is already recorded and a
    // retry would be deduped as a duplicate anyway.
    console.error("Agent turn failed:", error);
    return NextResponse.json({ ok: false });
  }
}

async function handleAgentPaySucceeded(
  data: Record<string, unknown>
): Promise<boolean> {
  const metadata = (data.metadata ?? {}) as Record<string, string>;
  const jobId =
    metadata.job_id ??
    (typeof data.job_id === "string" ? data.job_id : undefined);
  if (!jobId) return false;

  const payment = await getPaymentByJobId(jobId);
  if (!payment || payment.status === PAYMENT_STATUS.settled) return false;

  await updateJob(jobId, { fundedVia: FUNDED_VIA.agentpay });
  await settlePayment({
    paymentId: payment.id,
    status: PAYMENT_STATUS.settled,
  });
  return true;
}

async function handleLocationShare(
  data: Record<string, unknown>
): Promise<void> {
  const chatId =
    (typeof data.chat_id === "string" && data.chat_id) ||
    (typeof data.chatId === "string" && data.chatId) ||
    undefined;
  if (!chatId) return;

  const coords = await retrieveLocation(chatId);
  if (!coords?.lat || !coords?.lng) return;

  const job = await getJobByChatId(chatId);
  if (job) {
    await updateJob(job.id, {
      requesterLat: coords.lat,
      requesterLng: coords.lng,
    });
    await upsertUserByPhone({
      phone: job.requesterHandle,
      role: USER_ROLE.both,
      lastLat: coords.lat,
      lastLng: coords.lng,
    });
  }
}
