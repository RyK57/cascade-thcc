import { createAdminClient } from "@/utils/supabase/admin";
import type { MessageDirection } from "./record-job-message";

export interface JobMessage {
  direction: MessageDirection;
  body: string;
  createdAt: string;
}

interface JobMessageRow {
  direction: string;
  body: string;
  created_at: string;
}

/** How many turns of thread history the agent replays by default. */
export const JOB_HISTORY_LIMIT = 20;

/**
 * Recent messages for a job, oldest first so they can be replayed as LLM turns.
 * Reads the newest rows and reverses: one iMessage thread reuses the same job
 * row across requests, so only the tail is worth carrying into a prompt.
 */
export async function listJobMessages(
  jobId: string,
  limit = JOB_HISTORY_LIMIT
): Promise<JobMessage[]> {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("job_messages")
    .select("direction, body, created_at")
    .eq("job_id", jobId)
    .order("created_at", { ascending: false })
    .limit(limit)
    .returns<JobMessageRow[]>();

  if (error) throw new Error(error.message);

  return (data ?? [])
    .map((row) => ({
      direction: row.direction as MessageDirection,
      body: row.body,
      createdAt: row.created_at,
    }))
    .reverse();
}
