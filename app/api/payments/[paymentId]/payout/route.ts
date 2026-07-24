import { NextResponse } from "next/server";
import { z } from "zod";
import { authorizeInternalRequest } from "@/components/app/internal/authorize-internal-request";
import { getJobById } from "@/db/jobs";
import { claimEscrowRelease, getPaymentByJobId } from "@/db/payments";
import { finalizePeerPayout } from "@/libs/agent";
import { isAgentWalletConfigured } from "@/libs/dynamic/agent-wallet";
import { payWorkerUsdc } from "@/libs/dynamic/pay-worker";
import { settlePayment } from "@/libs/agent";
import { JOB_TIER } from "@/utils/schema/agent";
import { JOB_STATUS } from "@/utils/schema/job";
import { PAYMENT_STATUS } from "@/utils/schema/payment";
import { isSupabaseAdminConfigured } from "@/utils/supabase/admin";

const bodySchema = z.object({
  /** Worker's EVM address to receive testnet USDC. */
  workerAddress: z.string().regex(/^0x[0-9a-fA-F]{40}$/, "Invalid EVM address"),
  /** Job id, used to sanity-check the payment belongs to it. */
  jobId: z.string().uuid().optional(),
});

/**
 * Operator-only manual escrow release. Customers approve in iMessage;
 * the agent path calls `finalizePeerPayout` directly — never this route.
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ paymentId: string }> }
) {
  if (!(await authorizeInternalRequest(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!isSupabaseAdminConfigured()) {
    return NextResponse.json(
      { error: "Database admin is not configured." },
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
    if (!payment) {
      return NextResponse.json(
        { error: "Pass jobId so the payout can be loaded." },
        { status: 400 }
      );
    }

    const job = await getJobById(payment.jobId);
    if (!job) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    if (job.status === JOB_STATUS.paid) {
      return NextResponse.json({ ok: true, alreadyPaid: true, payment });
    }

    // Escrow hold must not release until approve (peer) or explicit payment_pending expert path.
    const canRelease =
      job.status === JOB_STATUS.approved ||
      (job.tier === JOB_TIER.expert && job.status === JOB_STATUS.paymentPending) ||
      (!job.tier && job.status === JOB_STATUS.paymentPending);

    if (!canRelease) {
      return NextResponse.json(
        {
          error:
            "Escrow is held in the agent wallet. Release only after the requester approves the work.",
          jobStatus: job.status,
        },
        { status: 409 }
      );
    }

    if (job.tier === JOB_TIER.peer || job.status === JOB_STATUS.approved) {
      const outcome = await finalizePeerPayout(job);
      return NextResponse.json({ ok: true, outcome, payment });
    }

    if (!isAgentWalletConfigured()) {
      return NextResponse.json(
        {
          error:
            "Agent wallet is not configured. Set DYNAMIC_API_TOKEN (or DYNAMIC_API_KEY), AGENT_WALLET_METADATA, and optionally AGENT_WALLET_PASSWORD.",
        },
        { status: 503 }
      );
    }

    // The job.status read above is not mutual exclusion — two concurrent
    // requests both pass it and both broadcast. Claim the release slot
    // atomically first, exactly as finalizePeerPayout does on the peer path.
    const claimed = await claimEscrowRelease(paymentId);
    if (!claimed) {
      return NextResponse.json({ ok: true, alreadyReleased: true, payment });
    }

    // Deliberately not handing the slot back if this throws: a rejection can
    // still follow a broadcast (timeout, dropped response), and re-opening the
    // slot would risk paying twice. A stuck release is recoverable; a double
    // payout is not.
    const payout = await payWorkerUsdc({
      to: parsed.data.workerAddress,
      amountCents: payment.amountCents,
    });

    const settled = await settlePayment({
      paymentId,
      status: PAYMENT_STATUS.settled,
      dynamicWalletAddress: parsed.data.workerAddress,
      // The transfer above is the actual worker payout, so this is the one
      // settle that may close the job as paid.
      workerPaid: true,
    });

    return NextResponse.json({ ok: true, payout, payment: settled });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Payout failed";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
