import { NextResponse } from "next/server";
import { z } from "zod";
import { settlePayment } from "@/libs/agent";
import { isAgentWalletConfigured } from "@/libs/dynamic/agent-wallet";
import { payWorkerUsdc } from "@/libs/dynamic/pay-worker";
import { getPaymentByJobId } from "@/db/payments";
import { PAYMENT_STATUS } from "@/utils/schema/payment";
import { isSupabaseAdminConfigured } from "@/utils/supabase/admin";

const bodySchema = z.object({
  /** Worker's EVM address to receive testnet USDC. */
  workerAddress: z.string().regex(/^0x[0-9a-fA-F]{40}$/, "Invalid EVM address"),
  /** Job id, used to sanity-check the payment belongs to it. */
  jobId: z.string().uuid().optional(),
});

/**
 * Autonomous agent payout (Dynamic track): the agent's own server wallet sends
 * testnet USDC to the worker, then settles the payment — which closes the job
 * and confirms on the original iMessage thread.
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ paymentId: string }> }
) {
  if (!isSupabaseAdminConfigured()) {
    return NextResponse.json(
      { error: "Supabase admin is not configured. Set SUPABASE_SERVICE_ROLE_KEY." },
      { status: 503 }
    );
  }
  if (!isAgentWalletConfigured()) {
    return NextResponse.json(
      {
        error:
          "Agent wallet is not configured. Set DYNAMIC_API_TOKEN and AGENT_WALLET_ADDRESS.",
      },
      { status: 503 }
    );
  }

  const json = await request.json().catch(() => null);
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid body", issues: parsed.error.issues },
      { status: 400 }
    );
  }

  const { paymentId } = await params;

  try {
    const payment = parsed.data.jobId
      ? await getPaymentByJobId(parsed.data.jobId)
      : null;
    if (parsed.data.jobId && payment?.id !== paymentId) {
      return NextResponse.json(
        { error: "Payment does not belong to that job." },
        { status: 400 }
      );
    }

    const amountCents = payment?.amountCents;
    if (!amountCents) {
      return NextResponse.json(
        { error: "Pass jobId so the payout amount can be loaded." },
        { status: 400 }
      );
    }

    const payout = await payWorkerUsdc({
      to: parsed.data.workerAddress,
      amountCents,
    });

    const settled = await settlePayment({
      paymentId,
      status: PAYMENT_STATUS.settled,
      dynamicWalletAddress: parsed.data.workerAddress,
    });

    return NextResponse.json({ ok: true, payout, payment: settled });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Payout failed";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
