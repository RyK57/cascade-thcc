import { createAdminClient } from "@/utils/supabase/admin";
import type { Job } from "@/utils/schema/job";
import { JOB_ROW_COLUMNS, mapJobRow, type JobRow } from "./map-row";

export async function getJobByStatusCardMessageId(
  messageId: string
): Promise<Job | null> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("jobs")
    .select(JOB_ROW_COLUMNS)
    .eq("status_card_message_id", messageId)
    .maybeSingle<JobRow>();

  if (error) {
    throw new Error(error.message);
  }
  if (!data) return null;
  return mapJobRow(data);
}
