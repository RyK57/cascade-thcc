import { createAdminClient } from "@/utils/supabase/admin";
import type { Job } from "@/utils/schema/job";
import { JOB_ROW_COLUMNS, mapJobRow, type JobRow } from "./map-row";

export async function getJobByClaimChatId(
  claimChatId: string
): Promise<Job | null> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("jobs")
    .select(JOB_ROW_COLUMNS)
    .eq("claim_chat_id", claimChatId)
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle<JobRow>();

  if (error) throw new Error(error.message);
  if (!data) return null;
  return mapJobRow(data);
}
