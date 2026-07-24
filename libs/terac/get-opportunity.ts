import { teracRequest } from "./client";

export async function getOpportunity(opportunityId: string) {
  return teracRequest<Record<string, unknown>>({
    path: `/opportunities/${opportunityId}`,
  });
}
