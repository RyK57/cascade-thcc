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
}: SettlePaymentInput): Promise<Payment> {
  let payment = await updatePaymentStatus(
    paymentId,
    status,
    dynamicWalletAddress
  );

  if (payment.status !== PAYMENT_STATUS.settled) return payment;

  const hash = escrowTxHash ?? payment.escrowTxHash ?? simulatedEscrowHash(paymentId);
  if (!payment.escrowTxHash || escrowTxHash) {
    payment = await updatePayment(paymentId, { escrowTxHash: hash });
  }

  const explorerUrl = explorerTxUrl(hash);
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
