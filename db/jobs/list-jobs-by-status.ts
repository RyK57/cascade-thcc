import { createAdminClient } from "@/utils/supabase/admin";
import type { Job, JobStatus } from "@/utils/schema/job";
import { JOB_ROW_COLUMNS, mapJobRow, type JobRow } from "./map-row";

export async function listJobsByStatus(
  statuses: JobStatus[],
  limit = 50
): Promise<Job[]> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("jobs")
    .select(JOB_ROW_COLUMNS)
    .in("status", statuses)
    .order("updated_at", { ascending: true })
    .limit(limit)
    .returns<JobRow[]>();

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []).map(mapJobRow);
}
