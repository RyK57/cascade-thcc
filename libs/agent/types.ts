export const AGENT_INTENT = {
  affirm: "affirm",
  decline: "decline",
  status: "status",
  payCredits: "pay_credits",
  freeform: "freeform",
} as const;

export type AgentIntent = (typeof AGENT_INTENT)[keyof typeof AGENT_INTENT];

export const AGENT_ACTION = {
  duplicate: "duplicate",
  clarified: "clarified",
  answeredAi: "answered_ai",
  drafted: "drafted",
  draftPending: "draft_pending",
  quoted: "quoted",
  refined: "refined",
  launched: "launched",
  keptDraft: "kept_draft",
  statusReported: "status_reported",
  workReady: "work_ready",
  funded: "funded",
  claimed: "claimed",
  delivered: "delivered",
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
  effect?: "confetti";
}
