import { describe, expect, it } from "vitest";
import {
  generateLinkToken,
  generateOtpCode,
  hashCode,
  hashesMatch,
  hashToken,
  normalizePhone,
  samePhone,
} from "@/libs/account/tokens";

describe("normalizePhone", () => {
  it("collapses formatting so one person is one account", () => {
    expect(normalizePhone("+1 (512) 226-3512")).toBe("+15122263512");
    expect(samePhone("+1 512-226-3512", "+15122263512")).toBe(true);
  });

  it("keeps Apple ID handles intact", () => {
    // iMessage delivers Apple IDs as often as numbers; digit-stripping those
    // would collapse every email handle to the same empty account.
    expect(normalizePhone("Person@Example.com")).toBe("person@example.com");
  });

  it("does not treat two different numbers as one", () => {
    expect(samePhone("+15122263512", "+15129377003")).toBe(false);
  });
});

describe("token hashing", () => {
  it("never stores the raw credential", () => {
    const token = generateLinkToken();
    expect(hashToken(token)).not.toContain(token);
    expect(hashToken(token)).toHaveLength(64);
  });

  it("binds a code hash to its phone", () => {
    // 6 digits alone are guessable across accounts; the phone is the salt.
    expect(hashCode("+15122263512", "123456")).not.toBe(
      hashCode("+15129377003", "123456")
    );
  });

  it("matches a code regardless of handle formatting", () => {
    expect(hashCode("+1 (512) 226-3512", "123456")).toBe(
      hashCode("+15122263512", "123456")
    );
  });
});

describe("hashesMatch", () => {
  it("accepts equal digests and rejects different ones", () => {
    const digest = hashToken("same");
    expect(hashesMatch(digest, hashToken("same"))).toBe(true);
    expect(hashesMatch(digest, hashToken("other"))).toBe(false);
  });

  it("rejects a length mismatch without throwing", () => {
    expect(hashesMatch("abc", hashToken("abc"))).toBe(false);
  });
});

describe("generateOtpCode", () => {
  it("always produces six digits", () => {
    for (let i = 0; i < 50; i += 1) {
      expect(generateOtpCode()).toMatch(/^\d{6}$/);
    }
  });
});
