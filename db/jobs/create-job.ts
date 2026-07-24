import { createAdminClient } from "@/utils/supabase/admin";
import type { CreateJobInput, Job } from "@/utils/schema/job";
import { createJobSchema, JOB_STATUS } from "@/utils/schema/job";
import { JOB_ROW_COLUMNS, mapJobRow, type JobRow } from "./map-row";

export async function createJob(input: CreateJobInput): Promise<Job> {
  const parsed = createJobSchema.parse(input);
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("jobs")
    .insert({
      linq_chat_id: parsed.linqChatId,
      requester_handle: parsed.requesterHandle,
      title: parsed.title,
      description: parsed.description,
      status: JOB_STATUS.intake,
    })
    .select(JOB_ROW_COLUMNS)
    .single<JobRow>();

  if (error || !data) {
    throw new Error(error?.message ?? "Failed to create job");
  }

  return mapJobRow(data);
}
