import { z } from "zod";

/**
 * Worker tiers Cascade routes an inbound job to.
 * `peer` = seeded Linq humans (no credential); `expert` = Terac verified specialist.
 */
export const TIER_VALUES = ["ai", "peer", "expert"] as const;
export type Tier = (typeof TIER_VALUES)[number];

export const JOB_TIER = {
  ai: "ai",
  peer: "peer",
  expert: "expert",
} as const;

/**
 * Raw shape the triage tool returns (snake_case, matches the Anthropic tool schema).
 */
export const triageToolInputSchema = z.object({
  tier: z.enum(TIER_VALUES),
  job_summary: z.string().min(1),
  reason: z.string().min(1),
  needs_clarification: z.boolean(),
  clarifying_question: z.string().optional(),
  price_estimate_usd: z.number().nonnegative().optional(),
});

export interface TriageResult {
  tier: Tier;
  jobSummary: string;
  reason: string;
  needsClarification: boolean;
  clarifyingQuestion?: string;
  priceEstimateUsd?: number;
}

/**
 * Validate + normalize raw tool input into a clean camelCase TriageResult.
 * Returns null when the model returned something unusable.
 */
export function toTriageResult(input: unknown): TriageResult | null {
  const parsed = triageToolInputSchema.safeParse(input);
  if (!parsed.success) return null;
  const d = parsed.data;
  return {
    tier: d.tier,
    jobSummary: d.job_summary,
    reason: d.reason,
    needsClarification: d.needs_clarification,
    clarifyingQuestion: d.clarifying_question,
    priceEstimateUsd: d.price_estimate_usd,
  };
}
