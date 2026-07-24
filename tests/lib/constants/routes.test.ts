import { describe, expect, it } from "vitest";
import { ROUTES } from "@/lib/constants/routes";

describe("ROUTES", () => {
  it("exposes auth and app routes", () => {
    expect(ROUTES.auth.login).toBe("/auth/login");
    expect(ROUTES.main).toBe("/main");
    expect(ROUTES.internal).toBe("/internal");
  });
});
