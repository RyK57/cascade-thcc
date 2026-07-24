import { createAdminClient } from "@/utils/supabase/admin";
import type { Job } from "@/utils/schema/job";
import { JOB_STATUS } from "@/utils/schema/job";
import { JOB_ROW_COLUMNS, mapJobRow, type JobRow } from "./map-row";

/**
 * First-writer-wins claim: only succeeds when the job is still `funded`
 * and has no assignee.
 */
export async function claimJob(params: {
  jobId: string;
  assigneeUserId: string;
  claimChatId: string;
}): Promise<Job | null> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("jobs")
    .update({
      status: JOB_STATUS.claimed,
      assignee_user_id: params.assigneeUserId,
      claim_chat_id: params.claimChatId,
      updated_at: new Date().toISOString(),
    })
    .eq("id", params.jobId)
    .eq("status", JOB_STATUS.funded)
    .is("assignee_user_id", null)
    .select(JOB_ROW_COLUMNS)
    .maybeSingle<JobRow>();

  if (error) {
    throw new Error(error.message);
  }
  if (!data) return null;
  return mapJobRow(data);
}
