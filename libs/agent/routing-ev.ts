import type { Tier } from "@/utils/schema/agent";

/** Simple success priors for mechanism-design one-liners. */
const P_SUCCESS: Record<Tier, number> = {
  ai: 0.55,
  peer: 0.75,
  expert: 0.92,
};

export interface EvResult {
  tier: Tier;
  costUsd: number;
  expectedValueUsd: number;
  line: string;
}

export function computeTierEv(params: {
  tier: Tier;
  valueUsd: number;
  costUsd: number;
  trustScore?: number;
}): EvResult {
  let p = P_SUCCESS[params.tier];
  if (params.tier === "peer" && params.trustScore !== undefined) {
    p = Math.min(0.95, p + (params.trustScore - 50) / 400);
  }
  const expectedValueUsd = p * params.valueUsd - params.costUsd;
  return {
    tier: params.tier,
    costUsd: params.costUsd,
    expectedValueUsd,
    line: `Cascade EV: ${params.tier} ≈ $${expectedValueUsd.toFixed(2)} (p≈${p.toFixed(2)} × $${params.valueUsd.toFixed(0)} − $${params.costUsd.toFixed(0)})`,
  };
}

export function comparePeerExpertEv(params: {
  valueUsd: number;
  peerCostUsd: number;
  expertCostUsd: number;
  avgPeerTrust?: number;
}): {
  peer: EvResult;
  expert: EvResult;
  winner: "peer" | "expert";
  gapUsd: number;
  line: string;
} {
  const peer = computeTierEv({
    tier: "peer",
    valueUsd: params.valueUsd,
    costUsd: params.peerCostUsd,
    trustScore: params.avgPeerTrust,
  });
  const expert = computeTierEv({
    tier: "expert",
    valueUsd: params.valueUsd,
    costUsd: params.expertCostUsd,
  });
  const winner =
    peer.expectedValueUsd >= expert.expectedValueUsd ? "peer" : "expert";
  const gapUsd = Math.abs(peer.expectedValueUsd - expert.expectedValueUsd);
  return {
    peer,
    expert,
    winner,
    gapUsd,
    line: `Cascade EV: ${winner} wins (peer $${peer.expectedValueUsd.toFixed(2)} vs expert $${expert.expectedValueUsd.toFixed(2)}).`,
  };
}

export function bestEvLine(params: {
  valueUsd: number;
  peerCostUsd: number;
  expertCostUsd: number;
  avgPeerTrust?: number;
}): string {
  return comparePeerExpertEv(params).line;
}

/** Large EV gap used only for heuristic triage tie-breaks. */
export const EV_TIEBREAK_GAP_USD = 8;

export function claimExpectedCredits(params: {
  priceUsdCents: number;
  trustScore: number;
  competingPeers: number;
}): number {
  const winP = Math.min(
    0.9,
    (params.trustScore / 100) / Math.max(1, params.competingPeers)
  );
  const payoutCredits = Math.max(1, Math.ceil(params.priceUsdCents / 100));
  return winP * payoutCredits;
}
