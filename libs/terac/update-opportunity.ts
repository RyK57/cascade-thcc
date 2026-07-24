import { teracRequest } from "./client";
import type { TeracOpportunity } from "./types";

export interface UpdateOpportunityInput {
  title?: string;
  description?: string;
  numParticipants?: number;
}

export async function updateOpportunity(
  opportunityId: string,
  input: UpdateOpportunityInput
): Promise<TeracOpportunity> {
  return teracRequest<TeracOpportunity>({
    method: "PATCH",
    path: `/opportunities/${opportunityId}`,
    body: {
      title: input.title,
      description: input.description,
      num_participants: input.numParticipants,
    },
  });
}
