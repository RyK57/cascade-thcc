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
  it("clears the lowest bid at the second-lowest price", () => {
    const clear = secondPriceClear([bid("a", 8), bid("b", 12)], 5);
    expect(clear).toMatchObject({
      winnerUserId: "a",
      // The second price is 12, not the winner's own 8 (+1). Clamping to the
      // winner's bid would make this a first-price auction.
      priceCredits: 12,
    });
  });

  it("wins on the lowest bid regardless of bid order", () => {
    const lowestLast = secondPriceClear([bid("b", 12), bid("a", 8)], 5);
    expect(lowestLast?.winnerUserId).toBe("a");
    expect(lowestLast?.winnerBid.chatId).toBeUndefined();
  });

  it("floors the clearing price", () => {
    expect(secondPriceClear([bid("a", 2), bid("b", 3)], 6)?.priceCredits).toBe(6);
  });

  it("falls back to the winner's own bid when there is no second bid", () => {
    expect(secondPriceClear([bid("a", 9)], 5)?.priceCredits).toBe(9);
  });

  it("returns null with no bids", () => {
    expect(secondPriceClear([], 1)).toBeNull();
  });
});
