import { createAdminClient } from "@/utils/supabase/admin";
import type { Job } from "@/utils/schema/job";
import { JOB_ROW_COLUMNS, mapJobRow, type JobRow } from "./map-row";

export const APPROVAL_SOURCE = {
  reaction: "imessage_reaction",
  message: "imessage_message",
  web: "web",
} as const;

export type ApprovalSource =
  (typeof APPROVAL_SOURCE)[keyof typeof APPROVAL_SOURCE];

/**
 * Claim the approval for a job, once. The `is null` filter makes this a
 * compare-and-set: a second heart on the same card — or a heart plus a typed
 * "yes" arriving together — finds the row already claimed and gets null back,
 * so the charge downstream can only ever run for one of them.
 */
export async function claimJobApproval(params: {
  jobId: string;
  source: ApprovalSource;
}): Promise<Job | null> {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("jobs")
    .update({
      approved_at: new Date().toISOString(),
      approved_via: params.source,
    })
    .eq("id", params.jobId)
    .is("approved_at", null)
    .select(JOB_ROW_COLUMNS)
    .maybeSingle<JobRow>();

  if (error) throw new Error(error.message);
  return data ? mapJobRow(data) : null;
}
