import { createAdminClient } from "@/utils/supabase/admin";
import type { CreatePayoutInput, Payout } from "@/utils/schema/payout";
import { createPayoutSchema } from "@/utils/schema/payout";

export async function createPayout(input: CreatePayoutInput): Promise<Payout> {
  const parsed = createPayoutSchema.parse(input);
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("payouts")
    .insert({
      job_id: parsed.jobId,
      tx_hash: parsed.txHash,
      amount_usdc_cents: parsed.amountUsdcCents,
      status: parsed.status,
    })
    .select("id, job_id, tx_hash, amount_usdc_cents, status, created_at")
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "Failed to create payout");
  }

  return {
    id: data.id,
    jobId: data.job_id,
    txHash: data.tx_hash,
    amountUsdcCents: data.amount_usdc_cents,
    status: data.status,
    createdAt: data.created_at,
  };
}
