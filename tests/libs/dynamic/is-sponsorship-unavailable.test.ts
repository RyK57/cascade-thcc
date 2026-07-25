import { describe, expect, it } from "vitest";
import { isSponsorshipUnavailable } from "@/libs/dynamic/is-sponsorship-unavailable";

describe("isSponsorshipUnavailable", () => {
  it("allows the self-funded retry when sponsorship is genuinely off", () => {
    expect(
      isSponsorshipUnavailable(new Error("Gas sponsorship is not enabled"))
    ).toBe(true);
    expect(
      isSponsorshipUnavailable(new Error("paymaster unsupported for chain"))
    ).toBe(true);
  });

  it("refuses to retry when the transfer may already have broadcast", () => {
    expect(isSponsorshipUnavailable(new Error("Request timed out"))).toBe(
      false
    );
    expect(isSponsorshipUnavailable(new Error("ECONNRESET"))).toBe(false);
    expect(isSponsorshipUnavailable(new Error("fetch failed"))).toBe(false);
    expect(isSponsorshipUnavailable(new Error("already known"))).toBe(false);
    expect(isSponsorshipUnavailable(new Error("nonce too low"))).toBe(false);
  });

  it("fails closed on an unrecognized error", () => {
    expect(isSponsorshipUnavailable(new Error("something odd"))).toBe(false);
    expect(isSponsorshipUnavailable(undefined)).toBe(false);
  });
});
