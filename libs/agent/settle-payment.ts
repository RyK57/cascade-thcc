import { getJobById, MESSAGE_DIRECTION, recordJobMessage, updateJob } from "@/db/jobs";
import { updatePaymentStatus } from "@/db/payments";
import { isLinqConfigured, sendChatMessage } from "@/libs/linq";
import type { Payment, PaymentStatus } from "@/utils/schema/payment";
import { PAYMENT_STATUS } from "@/utils/schema/payment";
import { JOB_STATUS } from "@/utils/schema/job";
import { paidReply } from "./reply-templates";

interface SettlePaymentInput {
  paymentId: string;
  status: PaymentStatus;
  dynamicWalletAddress?: string;
}

/**
 * Dynamic-side wiring: advance payment state, and when it settles, close the
 * job and confirm on the original iMessage thread.
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

  await updateJob(job.id, { status: JOB_STATUS.paid });

  if (isLinqConfigured()) {
    const reply = paidReply();
    const sent = await sendChatMessage({ chatId: job.linqChatId, text: reply });
    await recordJobMessage({
      jobId: job.id,
      linqMessageId: sent.message?.id ?? `out_${crypto.randomUUID()}`,
      direction: MESSAGE_DIRECTION.outbound,
      body: reply,
    });
  }

  return payment;
}
