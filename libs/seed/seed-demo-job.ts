import { createJob, updateJob } from "@/db/jobs";
import { createPayment } from "@/db/payments";
import { getPayUrl } from "@/libs/agent";
import { JOB_STATUS, type Job } from "@/utils/schema/job";
import type { Payment } from "@/utils/schema/payment";

export interface SeedDemoJobInput {
  title?: string;
  amountCents?: number;
}

export interface SeedDemoJobResult {
  job: Job;
  payment: Payment;
  payUrl: string;
}

/**
 * Create a demo job already at `payment_pending` with a payment row — lets the
 * Mission Control checkout be demoed without Linq/Terac configured.
 * Keep amounts small: they map 1:1 to faucet USDC on Base Sepolia.
 */
export async function seedDemoJob({
  title = "Design review: landing page hero",
  amountCents = 300,
}: SeedDemoJobInput = {}): Promise<SeedDemoJobResult> {
  const created = await createJob({
    linqChatId: `demo_${crypto.randomUUID()}`,
    requesterHandle: "+15555550100",
    title,
    description: "Seeded demo job for the Mission Control escrow checkout.",
  });

  const job = await updateJob(created.id, {
    status: JOB_STATUS.paymentPending,
    quotedTotalCents: amountCents,
    quotedCurrency: "usd",
  });

  const payment = await createPayment({
    jobId: job.id,
    amountCents,
    currency: "usd",
  });

  return { job, payment, payUrl: getPayUrl(job.id) };
}
