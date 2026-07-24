import { describe, expect, it } from "vitest";
import { draftReply } from "@/libs/agent";
import type { TriageResult } from "@/utils/schema/agent";

const base: TriageResult = {
  tier: "ai",
  jobSummary: "summarize this article",
  reason: "answerable directly",
  needsClarification: false,
};

describe("draftReply", () => {
  it("asks the clarifying question when one is needed", () => {
    const reply = draftReply({
      ...base,
      needsClarification: true,
      clarifyingQuestion: "What's your budget?",
    });
    expect(reply).toBe("What's your budget?");
  });

  it("acknowledges an ai-tier job", () => {
    expect(draftReply({ ...base, tier: "ai" })).toContain("summarize this article");
  });

  it("routes a crowd-tier job to real people", () => {
    const reply = draftReply({ ...base, tier: "crowd" });
    expect(reply.toLowerCase()).toContain("real people");
  });

  it("promises cost confirmation for an expert-tier job", () => {
    const reply = draftReply({ ...base, tier: "expert" });
    expect(reply.toLowerCase()).toContain("cost");
  });
});
