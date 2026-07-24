import { teracRequest } from "./client";

export interface TeracOpportunitySummary {
  id: string;
  title: string;
  status: string;
  num_participants: number;
  created_at: string;
  pricing?: {
    cost_per_participant_cents: number;
    total_cost_cents: number;
    currency: string;
  };
}

interface ListOpportunitiesResponse {
  data: TeracOpportunitySummary[];
  pagination: {
    next_cursor?: string;
    has_more: boolean;
  };
}

interface ListOpportunitiesParams {
  limit?: number;
  cursor?: string;
  status?: string;
  projectId?: string;
}

export async function listOpportunities(
  params: ListOpportunitiesParams = {}
): Promise<ListOpportunitiesResponse> {
  return teracRequest<ListOpportunitiesResponse>({
    path: "/opportunities",
    query: {
      limit: params.limit,
      cursor: params.cursor,
      status: params.status,
      projectId: params.projectId,
    },
  });
}
