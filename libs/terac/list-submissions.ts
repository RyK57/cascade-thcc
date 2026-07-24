import { teracRequest } from "./client";
import type { TeracSubmission } from "./types";

interface ListSubmissionsParams {
  opportunityId: string;
  limit?: number;
  cursor?: string;
  status?: string;
}

interface ListSubmissionsResponse {
  data: TeracSubmission[];
  pagination: {
    next_cursor?: string;
    has_more: boolean;
  };
}

export async function listSubmissions({
  opportunityId,
  limit,
  cursor,
  status,
}: ListSubmissionsParams): Promise<ListSubmissionsResponse> {
  return teracRequest<ListSubmissionsResponse>({
    path: `/opportunities/${opportunityId}/submissions`,
    query: { limit, cursor, status },
  });
}
