import { createAdminClient } from "@/utils/supabase/admin";
import type { Job } from "@/utils/schema/job";
import { JOB_ROW_COLUMNS, mapJobRow, type JobRow } from "./map-row";

/**
 * Every job a phone started, newest first — the account home's job list.
 * Scoped by requester handle because that is the identity the web session
 * proves; a peer's claimed work is a separate query.
 */
export async function listJobsByRequesterHandle(
  handle: string,
  limit = 25
): Promise<Job[]> {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("jobs")
    .select(JOB_ROW_COLUMNS)
    .eq("requester_handle", handle)
    .order("created_at", { ascending: false })
    .limit(limit)
    .returns<JobRow[]>();

  if (error) throw new Error(error.message);
  return (data ?? []).map(mapJobRow);
}

/** Jobs a peer claimed, newest first — the earnings side of the account. */
export async function listJobsByAssignee(
  assigneeUserId: string,
  limit = 25
): Promise<Job[]> {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("jobs")
    .select(JOB_ROW_COLUMNS)
    .eq("assignee_user_id", assigneeUserId)
    .order("created_at", { ascending: false })
    .limit(limit)
    .returns<JobRow[]>();

  if (error) throw new Error(error.message);
  return (data ?? []).map(mapJobRow);
}
