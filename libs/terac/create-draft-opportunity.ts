import { teracRequest } from "./client";
import type {
  TeracOpportunity,
  TeracScreeningQuestion,
  TeracTask,
} from "./types";

// Values match the documented createOpportunity example; task_url is where the
// expert is sent to do the work.
export function defaultTeracTask(): TeracTask {
  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL?.trim() || "http://localhost:3000";
  return {
    sequence: 1,
    task_type: "interview",
    review_type: "auto_approve",
    task_url: siteUrl,
    duration_minutes: 30,
  };
}

export interface CreateDraftOpportunityInput {
  title: string;
  projectId: string;
  numParticipants: number;
  businessType: "b2c" | "b2b";
  tasks?: TeracTask[];
  description?: string;
  internalTitle?: string;
  screeningQuestions?: TeracScreeningQuestion[];
  expectedDaysToComplete?: number;
}

export async function createDraftOpportunity(
  input: CreateDraftOpportunityInput
): Promise<TeracOpportunity> {
  return teracRequest<TeracOpportunity>({
    method: "POST",
    path: "/opportunities",
    body: {
      title: input.title,
      project_id: input.projectId,
      num_participants: input.numParticipants,
      business_type: input.businessType,
      tasks: input.tasks ?? [defaultTeracTask()],
      description: input.description,
      internal_title: input.internalTitle,
      screening_questions: input.screeningQuestions,
      expected_days_to_complete: input.expectedDaysToComplete,
    },
  });
}
