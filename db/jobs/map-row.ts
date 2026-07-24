import type { FundedVia, Job, JobStatus } from "@/utils/schema/job";
import type { Tier } from "@/utils/schema/agent";

export interface JobRow {
  id: string;
  linq_chat_id: string;
  requester_handle: string;
  title: string;
  description: string | null;
  status: string;
  tier: string | null;
  terac_opportunity_id: string | null;
  terac_submission_id: string | null;
  terac_task_url: string | null;
  quoted_total_cents: number | null;
  quoted_currency: string | null;
  price_usd_cents: number | null;
  assignee_user_id: string | null;
  status_card_message_id: string | null;
  funded_via: string | null;
  claim_chat_id: string | null;
  triage_reason: string | null;
  created_at: string;
  updated_at: string;
}

export const JOB_ROW_COLUMNS =
  "id, linq_chat_id, requester_handle, title, description, status, tier, terac_opportunity_id, terac_submission_id, terac_task_url, quoted_total_cents, quoted_currency, price_usd_cents, assignee_user_id, status_card_message_id, funded_via, claim_chat_id, triage_reason, created_at, updated_at";

export function mapJobRow(row: JobRow): Job {
  return {
    id: row.id,
    linqChatId: row.linq_chat_id,
    requesterHandle: row.requester_handle,
    title: row.title,
    description: row.description ?? undefined,
    status: row.status as JobStatus,
    tier: (row.tier as Tier | null) ?? undefined,
    teracOpportunityId: row.terac_opportunity_id ?? undefined,
    teracSubmissionId: row.terac_submission_id ?? undefined,
    teracTaskUrl: row.terac_task_url ?? undefined,
    quotedTotalCents: row.quoted_total_cents ?? undefined,
    quotedCurrency: row.quoted_currency ?? undefined,
    priceUsdCents: row.price_usd_cents ?? undefined,
    assigneeUserId: row.assignee_user_id ?? undefined,
    statusCardMessageId: row.status_card_message_id ?? undefined,
    fundedVia: (row.funded_via as FundedVia | null) ?? undefined,
    claimChatId: row.claim_chat_id ?? undefined,
    triageReason: row.triage_reason ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
