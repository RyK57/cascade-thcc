import { describe, expect, it } from "vitest";
import { secondPriceClear, type JobBid } from "@/db/bids";

function bid(userId: string, credits: number): JobBid {
  return {
    id: userId,
    jobId: "job",
    peerUserId: userId,
    bidCredits: credits,
    createdAt: "2026-07-24T00:00:00.000Z",
  };
}

describe("secondPriceClear", () => {
  it("clears the lowest bid at second price (floored)", () => {
    const clear = secondPriceClear([bid("a", 8), bid("b", 12)], 5);
    expect(clear).toEqual({
      winnerUserId: "a",
      priceCredits: 9,
    });
  });

  it("returns null with no bids", () => {
    expect(secondPriceClear([], 1)).toBeNull();
  });
});
