import { teracRequest } from "./client";
import type { TeracOpportunity } from "./types";

export async function launchOpportunity(
  opportunityId: string
): Promise<TeracOpportunity> {
  return teracRequest<TeracOpportunity>({
    method: "POST",
    path: `/opportunities/${opportunityId}/launch`,
  });
}
