import { describe, expect, it } from "vitest";
import { getAuthRedirectPath, isProtectedPath } from "@/libs/auth/route-guards";
import { ROUTES } from "@/lib/constants/routes";

describe("isProtectedPath", () => {
  it("protects main and internal routes", () => {
    expect(isProtectedPath(ROUTES.main)).toBe(true);
    expect(isProtectedPath(`${ROUTES.main}/settings`)).toBe(true);
    expect(isProtectedPath(ROUTES.internal)).toBe(true);
    expect(isProtectedPath(ROUTES.home)).toBe(false);
    expect(isProtectedPath(ROUTES.auth.login)).toBe(false);
  });
});

describe("getAuthRedirectPath", () => {
  it("includes next query param", () => {
    expect(getAuthRedirectPath(ROUTES.main)).toBe(
      `${ROUTES.auth.login}?next=${encodeURIComponent(ROUTES.main)}`,
    );
  });
});
