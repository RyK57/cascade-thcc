import { describe, expect, it } from "vitest";
import { SANDBOX_DISPLAY_BALANCE_USDC } from "@/components/dynamic/dynamic-dashboard";

describe("DynamicDashboard sandbox balance", () => {
  it("pins the demo UI balance to 100 USDC", () => {
    expect(SANDBOX_DISPLAY_BALANCE_USDC).toBe("100.00");
  });
});
