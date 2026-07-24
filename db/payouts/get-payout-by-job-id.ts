import { createAdminClient } from "@/utils/supabase/admin";
import type { Payout } from "@/utils/schema/payout";

/**
 * Most recent payout recorded for a job, or null when none exists.
 *
 * This is the evidence that a release actually happened: `escrow_released_at`
 * only says a caller claimed the slot, and `payments.escrow_tx_hash` is the
 * *funding* tx, not the payout.
 */
export async function getPayoutByJobId(jobId: string): Promise<Payout | null> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("payouts")
    .select("id, job_id, tx_hash, amount_usdc_cents, status, created_at")
    .eq("job_id", jobId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!data) return null;

  return {
    id: data.id,
    jobId: data.job_id,
    txHash: data.tx_hash,
    amountUsdcCents: data.amount_usdc_cents,
    status: data.status,
    createdAt: data.created_at,
  };
}
