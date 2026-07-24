import { createAdminClient } from "@/utils/supabase/admin";
import { JOB_STATUS, type Job } from "@/utils/schema/job";
import { JOB_ROW_COLUMNS, mapJobRow, type JobRow } from "./map-row";

/** States where the peer in this claim chat is still working the job. */
const ACTIVE_CLAIM_STATUSES = [
  JOB_STATUS.claimed,
  JOB_STATUS.delivered,
  JOB_STATUS.approved,
];

/**
 * Resolve the job a peer's claim thread belongs to. Restricted to active
 * states: claim_chat_id outlives the job, so an unfiltered lookup makes a
 * peer's next, unrelated request resolve to somebody else's finished job.
 */
export async function getJobByClaimChatId(
  claimChatId: string
): Promise<Job | null> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("jobs")
    .select(JOB_ROW_COLUMNS)
    .eq("claim_chat_id", claimChatId)
    .in("status", ACTIVE_CLAIM_STATUSES)
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle<JobRow>();

  if (error) throw new Error(error.message);
  if (!data) return null;
  return mapJobRow(data);
}
