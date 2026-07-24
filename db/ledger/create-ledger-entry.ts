import { createAdminClient } from "@/utils/supabase/admin";
import type { CreateLedgerEntryInput, LedgerEntry } from "@/utils/schema/ledger";
import { createLedgerEntrySchema } from "@/utils/schema/ledger";

export async function createLedgerEntry(
  input: CreateLedgerEntryInput
): Promise<LedgerEntry> {
  const parsed = createLedgerEntrySchema.parse(input);
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("ledger")
    .insert({
      user_id: parsed.userId,
      delta_credits: parsed.deltaCredits,
      job_id: parsed.jobId,
      reason: parsed.reason,
    })
    .select("id, user_id, delta_credits, job_id, reason, created_at")
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "Failed to create ledger entry");
  }

  return {
    id: data.id,
    userId: data.user_id,
    deltaCredits: data.delta_credits,
    jobId: data.job_id ?? undefined,
    reason: data.reason,
    createdAt: data.created_at,
  };
}
