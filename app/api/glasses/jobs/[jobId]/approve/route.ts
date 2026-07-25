import { NextResponse } from "next/server";
import { getJobById } from "@/db/jobs";
import { getPaymentByJobId } from "@/db/payments";
import { runAgentTurn, settlePayment } from "@/libs/agent";
import { isLinqConfigured } from "@/libs/linq";
import { JOB_STATUS } from "@/utils/schema/job";
import { PAYMENT_STATUS } from "@/utils/schema/payment";
import { isSupabaseAdminConfigured } from "@/utils/supabase/admin";

export const runtime = "nodejs";

interface RouteContext {
  params: Promise<{ jobId: string }>;
}

/**
 * Approve from the Ray-Ban Display HUD (Neural Band tap). Reuses the exact
 * tapback-affirm path: same state machine as a heart reaction in iMessage —
 * launches quotes, approves deliverables, triggers payouts.
 */
export async function POST(request: Request, context: RouteContext) {
  const token = process.env.GLASSES_TOKEN?.trim();
  if (token) {
    const provided = new URL(request.url).searchParams.get("token");
    if (provided !== token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }
  if (!isSupabaseAdminConfigured()) {
    return NextResponse.json({ error: "Not configured" }, { status: 503 });
  }
  // runAgentTurn sends its reply through Linq unguarded, and by then the
  // deliverable is approved and the payout released. Refuse up front rather
  // than paying out and then throwing a 500 the HUD reads as failure.
  if (!isLinqConfigured()) {
    return NextResponse.json(
      { error: "Linq is not configured. Set LINQ_API_V3_API_KEY." },
      { status: 503 }
    );
  }

  const { jobId } = await context.params;
  const job = await getJobById(jobId);
  if (!job) {
    return NextResponse.json({ error: "Job not found" }, { status: 404 });
  }

  try {
    const result = await runAgentTurn({
      kind: "reaction",
      eventId: `glasses:${jobId}:${crypto.randomUUID()}`,
      messageId: job.statusCardMessageId ?? `glasses-${jobId}`,
      chatId: job.linqChatId,
      senderHandle: job.requesterHandle,
      reactionType: "love",
      reactionId: `glasses:${jobId}:${crypto.randomUUID()}`,
      isAffirm: true,
    });

    // DEMO MODE: a pinch on the HUD shouldn't detour through the pay page —
    // auto-settle sandbox escrow when the approve parks in payment_pending.
    const after = await getJobById(jobId);
    if (after?.status === JOB_STATUS.paymentPending) {
      const payment = await getPaymentByJobId(jobId);
      if (payment) {
        await settlePayment({
          paymentId: payment.id,
          status: PAYMENT_STATUS.settled,
        });
      }
    }

    return NextResponse.json({ ok: true, action: result.action });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Approve failed";
    console.error("[cascade] glasses approve failed", jobId, error);
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
