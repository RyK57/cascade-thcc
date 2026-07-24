import {
  getJobById,
  MESSAGE_DIRECTION,
  recordJobMessage,
  updateJob,
} from "@/db/jobs";
import { updatePaymentStatus } from "@/db/payments";
import { isLinqConfigured, sendChatMessage } from "@/libs/linq";
import type { Payment, PaymentStatus } from "@/utils/schema/payment";
import { PAYMENT_STATUS } from "@/utils/schema/payment";
import { JOB_STATUS, JOB_TIER } from "@/utils/schema";
import { markPeerFunded } from "./handle-peer-turn";
import { paidReply } from "./reply-templates";

interface SettlePaymentInput {
  paymentId: string;
  status: PaymentStatus;
  dynamicWalletAddress?: string;
}

/**
 * Dynamic-side wiring: advance payment state. Peer jobs move to funded +
 * broadcast; expert jobs close as paid after escrow settle.
 */
export async function settlePayment({
  paymentId,
  status,
  dynamicWalletAddress,
}: SettlePaymentInput): Promise<Payment> {
  const payment = await updatePaymentStatus(
    paymentId,
    status,
    dynamicWalletAddress
  );

  if (payment.status !== PAYMENT_STATUS.settled) return payment;

  const job = await getJobById(payment.jobId);
  if (!job) return payment;

  if (job.tier === JOB_TIER.peer) {
    const outcome = await markPeerFunded(job);
    if (isLinqConfigured()) {
      const sent = await sendChatMessage({
        chatId: job.linqChatId,
        text: outcome.reply,
        idempotencyKey: `funded-${job.id}`,
      });
      await recordJobMessage({
        jobId: job.id,
        linqMessageId: sent.message?.id ?? `out_${crypto.randomUUID()}`,
        direction: MESSAGE_DIRECTION.outbound,
        body: outcome.reply,
      });
    }
    return payment;
  }

  await updateJob(job.id, { status: JOB_STATUS.paid });

  if (isLinqConfigured()) {
    const reply = paidReply();
    const sent = await sendChatMessage({
      chatId: job.linqChatId,
      text: reply,
      effect: "confetti",
      idempotencyKey: `paid-${job.id}`,
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
