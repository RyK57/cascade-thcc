import { describe, expect, it } from "vitest";
import {
  bestEvLine,
  claimExpectedCredits,
  comparePeerExpertEv,
  computeTierEv,
  EV_TIEBREAK_GAP_USD,
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

describe("comparePeerExpertEv", () => {
  it("prefers peer when expert is expensive", () => {
    const result = comparePeerExpertEv({
      valueUsd: 40,
      peerCostUsd: 12,
      expertCostUsd: 90,
      avgPeerTrust: 70,
    });
    expect(result.winner).toBe("peer");
    expect(result.gapUsd).toBeGreaterThan(EV_TIEBREAK_GAP_USD);
    expect(result.line).toContain("peer wins");
  });

  it("prefers expert when peer EV collapses", () => {
    const result = comparePeerExpertEv({
      valueUsd: 100,
      peerCostUsd: 80,
      expertCostUsd: 40,
      avgPeerTrust: 20,
    });
    expect(result.winner).toBe("expert");
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
