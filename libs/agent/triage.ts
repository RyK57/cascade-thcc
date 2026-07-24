import { createAnthropicClient } from "@/libs/ai";
import { TIER_VALUES, toTriageResult, type TriageResult } from "@/utils/schema/agent";
import { comparePeerExpertEv, EV_TIEBREAK_GAP_USD } from "./routing-ev";

const TRIAGE_MODEL = "claude-haiku-4-5-20251001";

const TRIAGE_SYSTEM = `You are the routing brain of Cascade, an iMessage task agent. Classify each task into exactly one tier and MOVE — do not interview the user.

Tiers:
- "ai": plans, advice, drafts, summaries, recommendations, brainstorming — anything you can answer with general knowledge. price_estimate_usd=0. Prefer ai over clarifying.
- "peer": needs a real person without a credential (user testing, text/call a phone, signup checks, errands, opinions, labeling). price_estimate_usd typically 8-25.
- "expert": verified specialist via Terac (legal, medical, CPA, senior eng review). Use sparingly. price_estimate_usd typically 50-200.

Hard rules:
- Bias peer over expert unless a credential is clearly required.
- Prefer routing with sensible defaults over asking. Fill missing details yourself (assume reasonable defaults in job_summary).
- "Plan my week…", fundraising advice, movie recs → ai, needs_clarification=false.
- "Have someone test/text my signup on a real phone" → peer even if URL/code is messy; put whatever they gave in job_summary.
- needs_clarification=true ONLY when the task is impossible without ONE missing fact (e.g. no phone number at all for a "text this number" job). Never ask follow-up interviews. Never ask genre/mood/stage chains.
- If prior context + latest message already describe a task, route it. Always call route_job.`;

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
        description:
          "True only if work is impossible without one missing critical fact. Almost always false.",
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

export interface TriageJobInput {
  /** Latest inbound message. */
  text: string;
  /** Prior job description / clarify thread, if any. */
  priorContext?: string;
  /** True when we already asked one clarifying question — never ask again. */
  alreadyClarified?: boolean;
}

/**
 * Classify an inbound task into a worker tier using a tool-forced LLM call.
 * Falls back to heuristics if the model misbehaves or keeps clarifying.
 */
export async function triageJob(input: TriageJobInput | string): Promise<TriageResult> {
  const params: TriageJobInput =
    typeof input === "string" ? { text: input } : input;
  const text = params.text.trim();
  const prior = params.priorContext?.trim();
  const prompt = prior
    ? `Prior context:\n${prior}\n\nLatest message:\n${text}`
    : text;

  const heuristic = heuristicTriage(prompt);

  if (!process.env.ANTHROPIC_API_KEY?.trim()) {
    return finalizeTriage(heuristic, params.alreadyClarified);
  }

  try {
    const client = createAnthropicClient();
    const response = await client.messages.create({
      model: TRIAGE_MODEL,
      max_tokens: 512,
      system: TRIAGE_SYSTEM,
      tools: [triageTool],
      tool_choice: { type: "tool", name: "route_job" },
      messages: [{ role: "user", content: prompt }],
    });

    const toolUse = response.content.find((block) => block.type === "tool_use");
    const llm = toolUse ? toTriageResult(toolUse.input) : null;
    const merged = mergeTriage(llm, heuristic, prompt);
    return finalizeTriage(merged, params.alreadyClarified);
  } catch (error) {
    console.error("triageJob failed; using heuristic", error);
    return finalizeTriage(heuristic, params.alreadyClarified);
  }
}

/**
 * An explicit ask for a human. This beats the LLM's tier choice: when someone
 * says "have someone…" they are buying a person's judgment, not an AI answer.
 */
const HUMAN_REQUEST_PATTERN =
  /\b(someone|somebody|a human|real human|real person|real people|a person|have (a )?(guy|girl|friend|peer)|another person|second pair of eyes|human eyes)\b/i;

export function wantsHuman(text: string): boolean {
  return HUMAN_REQUEST_PATTERN.test(text);
}

/** Export for tests — keyword router used when LLM is off or over-clarifies. */
export function heuristicTriage(text: string): TriageResult {
  const lower = text.toLowerCase();

  if (
    /\b(new task|disregard|scratch that|forget (that|it)|different (task|job)|actually)\b/.test(
      lower
    ) &&
    /\b(test|phone|signup|sign[- ]?up|text (my|this)|real (phone|person|human))\b/.test(
      lower
    )
  ) {
    return maybeEvTieBreak({
      tier: "peer",
      jobSummary: clipSummary(text),
      reason: "Requester switched to a peer phone/signup check.",
      needsClarification: false,
      priceEstimateUsd: 12,
    });
  }

  if (
    /\b(senior|lawyer|attorney|doctor|cpa|engineer review|api design|legal|medical|financial)\b/.test(
      lower
    )
  ) {
    return maybeEvTieBreak({
      tier: "expert",
      jobSummary: clipSummary(text),
      reason: "Looks like it needs a verified specialist.",
      needsClarification: false,
      priceEstimateUsd: 84,
    });
  }

  if (wantsHuman(text)) {
    return maybeEvTieBreak({
      tier: "peer",
      jobSummary: clipSummary(text),
      reason: "You asked for a real person, so this goes to a peer.",
      needsClarification: false,
      priceEstimateUsd: 12,
    });
  }

  if (
    /\b(test|phone|signup|sign[- ]?up|errand|opinion|label|compare|real (person|people|human|phone)|text (my|this|them)|qa|user test)\b/.test(
      lower
    )
  ) {
    return maybeEvTieBreak({
      tier: "peer",
      jobSummary: clipSummary(text),
      reason: "A peer can do this without a credential.",
      needsClarification: false,
      priceEstimateUsd: 12,
    });
  }

  return {
    tier: "ai",
    jobSummary: clipSummary(text),
    reason: "Cascade can answer this directly.",
    needsClarification: false,
    priceEstimateUsd: 0,
  };
}

function mergeTriage(
  llm: TriageResult | null,
  heuristic: TriageResult,
  prompt: string
): TriageResult {
  if (!llm) return heuristic;

  // "Have someone…" is a product signal, not a hint. Never answer it with AI.
  const latestForHuman = prompt.split("Latest message:").pop() ?? prompt;
  if (llm.tier === "ai" && wantsHuman(latestForHuman)) {
    return {
      ...llm,
      tier: "peer",
      needsClarification: false,
      clarifyingQuestion: undefined,
      reason: "You asked for a real person, so this goes to a peer.",
      priceEstimateUsd: llm.priceEstimateUsd || 12,
    };
  }

  // Keyword peer/expert beats an LLM that stalls on clarification.
  if (
    llm.needsClarification &&
    !heuristic.needsClarification &&
    (heuristic.tier === "peer" || heuristic.tier === "expert")
  ) {
    return {
      ...heuristic,
      jobSummary: llm.jobSummary || heuristic.jobSummary,
      reason: `${heuristic.reason} (overrode clarify loop)`,
    };
  }

  // Short follow-ups after context should not restart an interview.
  const latest = prompt.split("Latest message:").pop()?.trim() ?? prompt;
  if (
    llm.needsClarification &&
    latest.length < 80 &&
    prompt.toLowerCase().includes("prior context")
  ) {
    return {
      ...llm,
      needsClarification: false,
      clarifyingQuestion: undefined,
      reason: `${llm.reason} (answered with available context)`,
    };
  }

  return llm;
}

function finalizeTriage(
  result: TriageResult,
  alreadyClarified?: boolean
): TriageResult {
  if (alreadyClarified && result.needsClarification) {
    return {
      ...result,
      needsClarification: false,
      clarifyingQuestion: undefined,
      reason: `${result.reason} (clarification cap)`,
    };
  }
  return result;
}

function clipSummary(text: string): string {
  const compact = text.replace(/\s+/g, " ").trim();
  return compact.length > 140 ? `${compact.slice(0, 137)}...` : compact;
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
