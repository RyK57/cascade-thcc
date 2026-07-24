import { describe, expect, it } from "vitest";
import {
  bestEvLine,
  claimExpectedCredits,
  computeTierEv,
} from "@/libs/agent/routing-ev";

describe("computeTierEv", () => {
  it("returns peer EV using trust-adjusted success prior", () => {
    const result = computeTierEv({
      tier: "peer",
      valueUsd: 40,
      costUsd: 12,
      trustScore: 90,
    });
    expect(result.expectedValueUsd).toBeGreaterThan(0);
    expect(result.line).toContain("peer");
  });
});

describe("bestEvLine", () => {
  it("compares peer vs expert in one line", () => {
    const line = bestEvLine({
      valueUsd: 80,
      peerCostUsd: 12,
      expertCostUsd: 150,
      avgPeerTrust: 80,
    });
    expect(line).toMatch(/Cascade EV:/);
    expect(line).toMatch(/peer/);
    expect(line).toMatch(/expert/);
  });
});

describe("claimExpectedCredits", () => {
  it("scales with trust and competition", () => {
    const high = claimExpectedCredits({
      priceUsdCents: 1200,
      trustScore: 90,
      competingPeers: 2,
    });
    const low = claimExpectedCredits({
      priceUsdCents: 1200,
      trustScore: 40,
      competingPeers: 8,
    });
    expect(high).toBeGreaterThan(low);
  });
});
