import {
  getJobById,
  MESSAGE_DIRECTION,
  recordJobMessage,
  updateJob,
} from "@/db/jobs";
import { updatePayment, updatePaymentStatus } from "@/db/payments";
import { explorerTxUrl } from "@/libs/dynamic/sandbox";
import { isLinqConfigured, sendChatMessage } from "@/libs/linq";
import type { Payment, PaymentStatus } from "@/utils/schema/payment";
import { PAYMENT_STATUS } from "@/utils/schema/payment";
import { JOB_STATUS, JOB_TIER } from "@/utils/schema";
import { markPeerFunded } from "./handle-peer-turn";
import { fundedExplorerReply, paidReply } from "./reply-templates";
import { HUD_STAGE, syncJobHud } from "./status-hud";

interface SettlePaymentInput {
  paymentId: string;
  status: PaymentStatus;
  dynamicWalletAddress?: string;
  escrowTxHash?: string;
  /**
   * On-chain hash of the worker payout transfer. Used for the paid reply
   * receipt — never overwrite the escrow funding hash with this.
   */
  workerTxHash?: string;
  /**
   * True only when the worker has actually been paid. Funding escrow is not
   * the same event: closing the job as `paid` at fund time makes the release
   * path unreachable (the payout route short-circuits on `paid`) and strands
   * the USDC in the agent wallet forever.
   */
  workerPaid?: boolean;
}

function simulatedEscrowHash(paymentId: string): string {
  const compact = paymentId.replace(/-/g, "").slice(0, 36);
  return `0xesc${compact.padEnd(36, "0")}`;
}

/**
 * Dynamic-side wiring: advance payment state. Peer jobs move to funded +
 * broadcast; expert jobs close as paid after escrow settle.
 */
export async function settlePayment({
  paymentId,
  status,
  dynamicWalletAddress,
  escrowTxHash,
  workerTxHash,
  workerPaid = false,
}: SettlePaymentInput): Promise<Payment> {
  let payment = await updatePaymentStatus(
    paymentId,
    status,
    dynamicWalletAddress
  );

  if (payment.status !== PAYMENT_STATUS.settled) return payment;

  const hash =
    escrowTxHash ?? payment.escrowTxHash ?? simulatedEscrowHash(paymentId);
  const heldAt = payment.escrowHeldAt ?? new Date().toISOString();
  if (!payment.escrowTxHash || escrowTxHash || !payment.escrowHeldAt) {
    payment = await updatePayment(paymentId, {
      escrowTxHash: hash,
      escrowHeldAt: heldAt,
    });
  }

  // Paid replies should link the worker transfer, not the earlier escrow fund.
  const explorerUrl = explorerTxUrl(
    workerPaid && workerTxHash ? workerTxHash : hash
  );
  const job = await getJobById(payment.jobId);
  if (!job) return payment;

  if (job.tier === JOB_TIER.peer) {
    const outcome = await markPeerFunded(job, explorerUrl);
    if (isLinqConfigured()) {
      const reply = `${outcome.reply}\n${fundedExplorerReply(explorerUrl)}`;
      const sent = await sendChatMessage({
        chatId: job.linqChatId,
        text: reply,
        idempotencyKey: `funded-${job.id}`,
      });
      await recordJobMessage({
        jobId: job.id,
        linqMessageId: sent.message?.id ?? `out_${crypto.randomUUID()}`,
        direction: MESSAGE_DIRECTION.outbound,
        body: reply,
      });
    }
    return payment;
  }

  // Escrow is held, not released. Park the job awaiting release rather than
  // closing it as paid, and say so — a confetti "paid" here would be wrong on
  // both counts, since the worker has not been paid yet.
  if (!workerPaid) {
    let held = job;
    if (job.status !== JOB_STATUS.paymentPending) {
      held = await updateJob(job.id, { status: JOB_STATUS.paymentPending });
    }
    await syncJobHud(held, HUD_STAGE.funded).catch(() => undefined);

    if (isLinqConfigured()) {
      const reply = fundedExplorerReply(explorerUrl);
      const sent = await sendChatMessage({
        chatId: held.linqChatId,
        text: reply,
        idempotencyKey: `escrow-held-${held.id}`,
      });
      await recordJobMessage({
        jobId: held.id,
        linqMessageId: sent.message?.id ?? `out_${crypto.randomUUID()}`,
        direction: MESSAGE_DIRECTION.outbound,
        body: reply,
      });
    }

    return payment;
  }

  let paid = await updateJob(job.id, { status: JOB_STATUS.paid });
  paid = await syncJobHud(paid, HUD_STAGE.paid);

  if (isLinqConfigured()) {
    const reply = paidReply(explorerUrl);
    const sent = await sendChatMessage({
      chatId: paid.linqChatId,
      text: reply,
      effect: "confetti",
      idempotencyKey: `paid-${paid.id}`,
    });
    await recordJobMessage({
      jobId: paid.id,
      linqMessageId: sent.message?.id ?? `out_${crypto.randomUUID()}`,
      direction: MESSAGE_DIRECTION.outbound,
      body: reply,
    });
  }

  return payment;
}
