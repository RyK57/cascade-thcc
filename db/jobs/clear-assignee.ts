import { createAdminClient } from "@/utils/supabase/admin";
import type { Job } from "@/utils/schema/job";
import { JOB_STATUS } from "@/utils/schema/job";
import { JOB_ROW_COLUMNS, mapJobRow, type JobRow } from "./map-row";

export async function clearAssigneeAndReopen(jobId: string): Promise<Job> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("jobs")
    .update({
      status: JOB_STATUS.funded,
      assignee_user_id: null,
      claim_chat_id: null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", jobId)
    .select(JOB_ROW_COLUMNS)
    .single<JobRow>();

  if (error || !data) {
    throw new Error(error?.message ?? "Failed to reopen job");
  }
  return mapJobRow(data);
}
