import type { TriageResult } from "@/utils/schema/agent";

/**
 * Draft the in-thread reply the user sees after triage.
 * Pure function — no I/O — so the routing copy is trivially testable.
 */
export function draftReply(triage: TriageResult): string {
  if (triage.needsClarification && triage.clarifyingQuestion) {
    return triage.clarifyingQuestion;
  }

  switch (triage.tier) {
    case "ai":
      return `On it — ${triage.jobSummary}. Give me a sec and I'll drop the answer right here.`;
    case "peer":
      return `Got it: "${triage.jobSummary}". I'll put this in front of a Cascade peer, then report back in this thread.`;
    case "expert":
      return `Understood: "${triage.jobSummary}". This one needs a verified specialist — I'll line one up and confirm the cost with you before anything is spent.`;
  }
}
