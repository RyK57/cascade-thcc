import { describe, expect, it } from "vitest";
import { draftReply } from "@/libs/agent";

const base = {
  jobSummary: "summarize this brief",
  reason: "general knowledge",
  needsClarification: false,
} as const;

describe("draftReply", () => {
  it("asks the clarifying question when one is needed", () => {
    const reply = draftReply({
      ...base,
      tier: "ai",
      needsClarification: true,
      clarifyingQuestion: "Which city?",
    });
    expect(reply).toBe("Which city?");
  });

  it("acknowledges an ai-tier job", () => {
    expect(draftReply({ ...base, tier: "ai" })).toContain("summarize this");
  });

  it("routes a peer-tier job to Cascade peers", () => {
    const reply = draftReply({ ...base, tier: "peer" });
    expect(reply.toLowerCase()).toContain("peer");
  });

  it("promises cost confirmation for an expert-tier job", () => {
    const reply = draftReply({ ...base, tier: "expert" });
    expect(reply.toLowerCase()).toContain("cost");
  });
});
