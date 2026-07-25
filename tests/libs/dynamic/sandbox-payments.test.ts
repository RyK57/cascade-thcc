import { afterEach, describe, expect, it } from "vitest";
import {
  shouldSimulateSandboxPayments,
  simulatedSandboxTxHash,
} from "@/libs/dynamic/sandbox-payments";

const ORIGINAL = process.env.DYNAMIC_REAL_CHAIN_PAYMENTS;

afterEach(() => {
  if (ORIGINAL === undefined) delete process.env.DYNAMIC_REAL_CHAIN_PAYMENTS;
  else process.env.DYNAMIC_REAL_CHAIN_PAYMENTS = ORIGINAL;
});

describe("sandbox payments", () => {
  it("simulates by default while Dynamic gas sponsorship is broken", () => {
    delete process.env.DYNAMIC_REAL_CHAIN_PAYMENTS;
    expect(shouldSimulateSandboxPayments()).toBe(true);
  });

  it("opts into real chain only when explicitly enabled", () => {
    process.env.DYNAMIC_REAL_CHAIN_PAYMENTS = "1";
    expect(shouldSimulateSandboxPayments()).toBe(false);
  });

  it("builds a sim tx hash", () => {
    expect(simulatedSandboxTxHash()).toMatch(/^0xsim[0-9a-f]+$/);
  });
});
