import { createAdminClient } from "@/utils/supabase/admin";
import type { Job, UpdateJobInput } from "@/utils/schema/job";
import { updateJobSchema } from "@/utils/schema/job";
import { JOB_ROW_COLUMNS, mapJobRow, type JobRow } from "./map-row";

export async function updateJob(
  jobId: string,
  input: UpdateJobInput
): Promise<Job> {
  const parsed = updateJobSchema.parse(input);
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("jobs")
    .update({
      status: parsed.status,
      title: parsed.title,
      description: parsed.description,
      tier: parsed.tier,
      terac_opportunity_id: parsed.teracOpportunityId,
      terac_submission_id: parsed.teracSubmissionId,
      terac_task_url: parsed.teracTaskUrl,
      quoted_total_cents: parsed.quotedTotalCents,
      quoted_currency: parsed.quotedCurrency,
      price_usd_cents: parsed.priceUsdCents,
      assignee_user_id: parsed.assigneeUserId,
      status_card_message_id: parsed.statusCardMessageId,
      funded_via: parsed.fundedVia,
      claim_chat_id: parsed.claimChatId,
      triage_reason: parsed.triageReason,
      updated_at: new Date().toISOString(),
    })
    .eq("id", jobId)
    .select(JOB_ROW_COLUMNS)
    .single<JobRow>();

  if (error || !data) {
    throw new Error(error?.message ?? "Failed to update job");
  }

  return mapJobRow(data);
}
