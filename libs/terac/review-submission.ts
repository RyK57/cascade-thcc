import { teracRequest } from "./client";
import type { TeracSubmission } from "./types";

export interface ReviewSubmissionInput {
  submissionId: string;
  decision: "approve" | "reject";
}

export async function reviewSubmission({
  submissionId,
  decision,
}: ReviewSubmissionInput): Promise<TeracSubmission> {
  return teracRequest<TeracSubmission>({
    method: "POST",
    path: `/submissions/${submissionId}/${decision}`,
  });
}
