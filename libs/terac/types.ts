export const TERAC_OPPORTUNITY_STATUS = {
  draft: "draft",
  live: "live",
  paused: "paused",
  stopped: "stopped",
  completed: "completed",
} as const;

export const TERAC_SUBMISSION_STATUS = {
  inProgress: "in_progress",
  awaitingReview: "awaiting_review",
  approved: "approved",
  rejected: "rejected",
} as const;

export interface TeracPricing {
  cost_per_participant_cents: number;
  total_cost_cents: number;
  currency: string;
}

export interface TeracSubmissionStats {
  total: number;
  in_progress: number;
  awaiting_review: number;
  approved: number;
  rejected: number;
}

export interface TeracOpportunity {
  id: string;
  title: string;
  status: string;
  num_participants: number;
  created_at?: string;
  pricing?: TeracPricing;
  submission_stats?: TeracSubmissionStats;
}

export interface TeracSubmission {
  id: string;
  opportunity_id: string;
  status: string;
  participant_id: string;
  created_at: string;
  updated_at: string;
}

export interface TeracTask {
  sequence: number;
  task_type: string;
  review_type: string;
  task_url: string;
  duration_minutes: number;
}

export interface TeracScreeningAnswer {
  text: string;
  qualify_logic: string;
}

export interface TeracScreeningQuestion {
  key: string;
  text: string;
  pick: string;
  answers: TeracScreeningAnswer[];
}
