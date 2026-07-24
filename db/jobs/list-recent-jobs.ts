import { createAdminClient } from "@/utils/supabase/admin";
import type { Job } from "@/utils/schema/job";
import { JOB_ROW_COLUMNS, mapJobRow, type JobRow } from "./map-row";

/** Most recently updated jobs across all statuses — powers the glasses HUD. */
export async function listRecentJobs(limit = 6): Promise<Job[]> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("jobs")
    .select(JOB_ROW_COLUMNS)
    .order("updated_at", { ascending: false })
    .limit(limit);

  if (error) throw new Error(error.message);
  return ((data ?? []) as JobRow[]).map(mapJobRow);
}
