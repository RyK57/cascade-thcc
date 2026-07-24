import type { Job, JobStatus } from "@/utils/schema/job";

export interface JobRow {
  id: string;
  linq_chat_id: string;
  requester_handle: string;
  title: string;
  description: string | null;
  status: string;
  terac_opportunity_id: string | null;
  terac_submission_id: string | null;
  quoted_total_cents: number | null;
  quoted_currency: string | null;
  created_at: string;
  updated_at: string;
}

export const JOB_ROW_COLUMNS =
  "id, linq_chat_id, requester_handle, title, description, status, terac_opportunity_id, terac_submission_id, quoted_total_cents, quoted_currency, created_at, updated_at";

export function mapJobRow(row: JobRow): Job {
  return {
    id: row.id,
    linqChatId: row.linq_chat_id,
    requesterHandle: row.requester_handle,
    title: row.title,
    description: row.description ?? undefined,
    status: row.status as JobStatus,
    teracOpportunityId: row.terac_opportunity_id ?? undefined,
    teracSubmissionId: row.terac_submission_id ?? undefined,
    quotedTotalCents: row.quoted_total_cents ?? undefined,
    quotedCurrency: row.quoted_currency ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
