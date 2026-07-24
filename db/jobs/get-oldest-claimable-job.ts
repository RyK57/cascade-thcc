import { createAdminClient } from "@/utils/supabase/admin";
import type { Job } from "@/utils/schema/job";
import { JOB_STATUS } from "@/utils/schema/job";
import { JOB_TIER } from "@/utils/schema/agent";
import { JOB_ROW_COLUMNS, mapJobRow, type JobRow } from "./map-row";

export async function getOldestClaimablePeerJob(): Promise<Job | null> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("jobs")
    .select(JOB_ROW_COLUMNS)
    .eq("status", JOB_STATUS.funded)
    .eq("tier", JOB_TIER.peer)
    .is("assignee_user_id", null)
    .order("updated_at", { ascending: true })
    .limit(1)
    .maybeSingle<JobRow>();

  if (error) throw new Error(error.message);
  if (!data) return null;
  return mapJobRow(data);
}
