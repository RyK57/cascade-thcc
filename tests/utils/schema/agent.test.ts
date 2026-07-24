import { describe, expect, it } from "vitest";
import { toTriageResult } from "@/utils/schema/agent";

describe("toTriageResult", () => {
  it("maps valid snake_case tool input to a camelCase TriageResult", () => {
    const result = toTriageResult({
      tier: "peer",
      job_summary: "test my landing page",
      reason: "needs real user reactions",
      needs_clarification: false,
      price_estimate_usd: 12,
    });
    expect(result).toEqual({
      tier: "peer",
      jobSummary: "test my landing page",
      reason: "needs real user reactions",
      needsClarification: false,
      clarifyingQuestion: undefined,
      priceEstimateUsd: 12,
    });
  });

  it("returns null on an invalid tier", () => {
    expect(
      toTriageResult({
        tier: "crowd",
        job_summary: "x",
        reason: "y",
        needs_clarification: false,
      })
    ).toBeNull();
  });

  it("returns null on missing fields", () => {
    expect(toTriageResult({ tier: "ai" })).toBeNull();
    expect(toTriageResult(null)).toBeNull();
  });
});
