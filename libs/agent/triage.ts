import { createAnthropicClient } from "@/libs/ai";
import { TIER_VALUES, toTriageResult, type TriageResult } from "@/utils/schema/agent";

/** Fast, cheap model for classification — swap up if routing quality matters more than latency. */
const TRIAGE_MODEL = "claude-haiku-4-5-20251001";

const TRIAGE_SYSTEM = `You are the routing brain of an iMessage concierge agent. A user texts you a task. Classify it into exactly one tier:

- "ai": you can fully complete it yourself right now with general knowledge or simple reasoning (quick answers, drafting text, summaries, math, recommendations that need no real-world action).
- "crowd": it needs real people from the general public to execute, verify, rate, test, or gather real-world/local input (opinions, quick errands framed as info-gathering, data labeling, "call this place and ask", user testing, head-to-head comparisons). Prefer this whenever real human input would make the result meaningfully better.
- "expert": it genuinely requires a verified specialist's professional judgment (legal, medical, financial, or engineering review). Use sparingly — only when a credentialed professional is truly required.

Bias toward "crowd" over "expert" unless a credential is clearly required.
Set needs_clarification=true and provide ONE clarifying_question only when a critical detail is missing (location, budget, or the concrete deliverable). Keep job_summary short and action-oriented. Always answer by calling the route_job tool.`;

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
    },
    required: ["tier", "job_summary", "reason", "needs_clarification"],
  },
};

/**
 * Classify an inbound task into a worker tier using a tool-forced LLM call.
 * Falls back to the `expert` tier (human-in-the-loop) if the model misbehaves,
 * so we never silently drop a user's request.
 */
export async function triageJob(text: string): Promise<TriageResult> {
  const client = createAnthropicClient();

  const response = await client.messages.create({
    model: TRIAGE_MODEL,
    max_tokens: 512,
    system: TRIAGE_SYSTEM,
    tools: [triageTool],
    tool_choice: { type: "tool", name: "route_job" },
    messages: [{ role: "user", content: text }],
  });

  const toolUse = response.content.find((block) => block.type === "tool_use");
  const triage = toolUse ? toTriageResult(toolUse.input) : null;

  return (
    triage ?? {
      tier: "expert",
      jobSummary: text.slice(0, 140),
      reason: "Triage was inconclusive; routing to a human for safety.",
      needsClarification: false,
    }
  );
}
