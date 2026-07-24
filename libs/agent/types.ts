export const AGENT_INTENT = {
  affirm: "affirm",
  decline: "decline",
  status: "status",
  freeform: "freeform",
} as const;

export type AgentIntent = (typeof AGENT_INTENT)[keyof typeof AGENT_INTENT];

export const AGENT_ACTION = {
  duplicate: "duplicate",
  drafted: "drafted",
  draftPending: "draft_pending",
  refined: "refined",
  launched: "launched",
  keptDraft: "kept_draft",
  statusReported: "status_reported",
  workReady: "work_ready",
  approvedWork: "approved_work",
  rejectedWork: "rejected_work",
  paymentPending: "payment_pending",
  paid: "paid",
  fallback: "fallback",
  errored: "errored",
} as const;

export type AgentAction = (typeof AGENT_ACTION)[keyof typeof AGENT_ACTION];

export interface AgentTurnResult {
  action: AgentAction;
  jobId?: string;
  reply?: string;
}
