import { createAnthropicClient } from "@/libs/ai";
import { TIER_VALUES, toTriageResult, type TriageResult } from "@/utils/schema/agent";
import { appendUserTurn, type ConversationTurn } from "./conversation";
import { comparePeerExpertEv, EV_TIEBREAK_GAP_USD } from "./routing-ev";

const TRIAGE_MODEL = "claude-haiku-4-5-20251001";

const TRIAGE_SYSTEM = `You are the routing brain of Cascade, an iMessage task agent. Classify each task into exactly one tier:

- "ai": you can fully complete it yourself right now with general knowledge (plans, drafts, summaries, math, recommendations with no real-world action). price_estimate_usd=0.
- "peer": needs a real person without a professional credential (user testing, phone checks, quick errands framed as info-gathering, opinions, labeling). Route here for seeded Cascade peers. price_estimate_usd typically 8-25.
- "expert": needs a verified specialist via Terac (legal, medical, financial, senior engineering review). Use sparingly. price_estimate_usd typically 50-200.

Bias toward "peer" over "expert" unless a credential is clearly required.
Set needs_clarification=true and provide ONE clarifying_question only when a critical detail is missing (location, budget, or the concrete deliverable). Keep job_summary short. Always answer by calling the route_job tool.

Earlier messages from this iMessage thread come before the latest one. Classify the LATEST request, but read it in the context of the thread: a short follow-up ("make it usage-based", "the second one") continues the previous task rather than starting a new one, and job_summary should reflect the whole request, not just the last few words.`;

const triageTool = {
  name: "route_job",
  description:
    "Classify an inbound task and route it to the worker tier that should handle it.",
  input_schema: {
    type: "object" as const,
    properties: {
      tier: {
        type: "string" as const,
        enum: [...TIER_VALUES],
        description: "Which worker tier should handle this job.",
      },
      job_summary: {
        type: "string" as const,
        description: "Short, action-oriented restatement of the task.",
      },
      reason: {
        type: "string" as const,
        description: "One sentence on why this tier fits.",
      },
      needs_clarification: {
        type: "boolean" as const,
        description: "True only if a critical detail is missing before work can start.",
      },
      clarifying_question: {
        type: "string" as const,
        description: "The single question to ask, when needs_clarification is true.",
      },
      price_estimate_usd: {
        type: "number" as const,
        description: "Estimated USD price (0 for ai).",
      },
    },
    required: [
      "tier",
      "job_summary",
      "reason",
      "needs_clarification",
      "price_estimate_usd",
    ],
  },
};

/**
 * Classify an inbound task into a worker tier using a tool-forced LLM call.
 * Falls back to peer (cheapest human) if the model misbehaves.
 */
export async function triageJob(
  text: string,
  history: ConversationTurn[] = []
): Promise<TriageResult> {
  if (!process.env.ANTHROPIC_API_KEY?.trim()) {
    return heuristicTriage(text);
  }

  try {
    const client = createAnthropicClient();
    const response = await client.messages.create({
      model: TRIAGE_MODEL,
      max_tokens: 512,
      system: TRIAGE_SYSTEM,
      tools: [triageTool],
      tool_choice: { type: "tool", name: "route_job" },
      messages: appendUserTurn(history, text),
    });

    const toolUse = response.content.find((block) => block.type === "tool_use");
    const triage = toolUse ? toTriageResult(toolUse.input) : null;
    return triage ?? heuristicTriage(text);
  } catch (error) {
    console.error("triageJob failed; using heuristic", error);
    return heuristicTriage(text);
  }
}

function heuristicTriage(text: string): TriageResult {
  const lower = text.toLowerCase();
  if (
    /\b(senior|lawyer|attorney|doctor|cpa|engineer review|api design|legal|medical|financial)\b/.test(
      lower
    )
  ) {
    return maybeEvTieBreak({
      tier: "expert",
      jobSummary: text.slice(0, 140),
      reason: "Looks like it needs a verified specialist.",
      needsClarification: false,
      priceEstimateUsd: 84,
    });
  }
  if (
    /\b(test|phone|signup|errand|opinion|label|compare|real (person|people|human))\b/.test(
      lower
    )
  ) {
    return maybeEvTieBreak({
      tier: "peer",
      jobSummary: text.slice(0, 140),
      reason: "A peer can do this without a credential.",
      needsClarification: false,
      priceEstimateUsd: 12,
    });
  }
  return {
    tier: "ai",
    jobSummary: text.slice(0, 140),
    reason: "Cascade can answer this directly.",
    needsClarification: false,
    priceEstimateUsd: 0,
  };
}

/**
 * When heuristic is between peer/expert and EV gap is large, prefer the EV winner.
 * Never overrides a clear AI route or an LLM tool choice.
 */
function maybeEvTieBreak(result: TriageResult): TriageResult {
  if (result.tier !== "peer" && result.tier !== "expert") return result;

  const estimate = result.priceEstimateUsd || 0;

  // Price each side on its own scale. Reusing the estimate for both made the
  // two costs equal whenever the heuristic said "expert", so `ev.winner`
  // always came back as the incoming tier and the guard below always
  // short-circuited — the tie-break could never actually redirect anything.
  const peerCost =
    result.tier === "peer"
      ? Math.max(5, estimate || 12)
      : Math.max(5, Math.min(estimate ? estimate / 3 : 12, 40));
  const expertCost =
    result.tier === "expert"
      ? Math.max(peerCost * 2, estimate || 84)
      : Math.max(peerCost * 3, 45);

  const valueUsd = Math.max(peerCost * 2, expertCost);
  const ev = comparePeerExpertEv({
    valueUsd,
    peerCostUsd: peerCost,
    expertCostUsd: expertCost,
    avgPeerTrust: 70,
  });

  if (ev.gapUsd < EV_TIEBREAK_GAP_USD || ev.winner === result.tier) {
    return result;
  }

  return {
    ...result,
    tier: ev.winner,
    reason: `${result.reason} EV tie-break → ${ev.winner} (gap $${ev.gapUsd.toFixed(0)}).`,
    priceEstimateUsd: ev.winner === "expert" ? expertCost : peerCost,
  };
}
