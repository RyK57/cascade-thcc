import { describe, expect, it } from "vitest";
import { isSessionValid } from "@/libs/auth/validate-session";

describe("isSessionValid", () => {
  it("returns false when session is null", () => {
    expect(isSessionValid(null)).toBe(false);
  });

  it("returns true when session is not expired", () => {
    expect(
      isSessionValid({
        expires_at: Math.floor(Date.now() / 1000) + 3600,
      } as never),
    ).toBe(true);
  });
});
