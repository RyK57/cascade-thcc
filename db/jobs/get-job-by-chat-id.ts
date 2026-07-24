import { createAdminClient } from "@/utils/supabase/admin";
import type { Job } from "@/utils/schema/job";
import { JOB_ROW_COLUMNS, mapJobRow, type JobRow } from "./map-row";

export async function getJobByChatId(linqChatId: string): Promise<Job | null> {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("jobs")
    .select(JOB_ROW_COLUMNS)
    .eq("linq_chat_id", linqChatId)
    .maybeSingle<JobRow>();

  if (error) throw new Error(error.message);
  return data ? mapJobRow(data) : null;
}
