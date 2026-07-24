import { describe, expect, it } from "vitest";
import { parseTrustRating } from "@/libs/agent";

describe("parseTrustRating", () => {
  it("parses lone integers", () => {
    expect(parseTrustRating("4")).toBe(4);
    expect(parseTrustRating("5/5")).toBe(5);
  });

  it("parses labeled ratings", () => {
    expect(parseTrustRating("rating: 3 — ok deliverable")).toBe(3);
    expect(parseTrustRating("Score = 2")).toBe(2);
  });

  it("returns null when no rating", () => {
    expect(parseTrustRating("looks fine")).toBeNull();
    expect(parseTrustRating("")).toBeNull();
  });
});
