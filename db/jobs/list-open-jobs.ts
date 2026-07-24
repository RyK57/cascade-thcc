import { createAdminClient } from "@/utils/supabase/admin";
import type { Job } from "@/utils/schema/job";
import { JOB_STATUS } from "@/utils/schema/job";
import { JOB_ROW_COLUMNS, mapJobRow, type JobRow } from "./map-row";

const ACTIVE_STATUSES = [
  JOB_STATUS.quoted,
  JOB_STATUS.funded,
  JOB_STATUS.claimed,
  JOB_STATUS.delivered,
  JOB_STATUS.approved,
  JOB_STATUS.launched,
  JOB_STATUS.inReview,
  JOB_STATUS.paymentPending,
] as const;

export async function listOpenJobs(limit = 25): Promise<Job[]> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("jobs")
    .select(JOB_ROW_COLUMNS)
    .in("status", [...ACTIVE_STATUSES])
    .order("updated_at", { ascending: false })
    .limit(limit)
    .returns<JobRow[]>();

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []).map(mapJobRow);
}
