import { createAdminClient } from "@/utils/supabase/admin";
import type { Payment } from "@/utils/schema/payment";
import { mapPaymentRow, PAYMENT_ROW_COLUMNS, type PaymentRow } from "./map-row";

/**
 * Payments for a set of jobs, keyed by job id. One round trip for the account
 * home instead of a getPaymentByJobId per row.
 */
export async function listPaymentsByJobIds(
  jobIds: string[]
): Promise<Map<string, Payment>> {
  if (jobIds.length === 0) return new Map();

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("payments")
    .select(PAYMENT_ROW_COLUMNS)
    .in("job_id", jobIds)
    .order("created_at", { ascending: false })
    .returns<PaymentRow[]>();

  if (error) throw new Error(error.message);

  const byJob = new Map<string, Payment>();
  for (const row of data ?? []) {
    const payment = mapPaymentRow(row);
    // Ordered newest-first, so the first hit per job is the live one.
    if (!byJob.has(payment.jobId)) byJob.set(payment.jobId, payment);
  }
  return byJob;
}
