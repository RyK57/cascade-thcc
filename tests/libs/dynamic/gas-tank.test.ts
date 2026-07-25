import { describe, expect, it } from "vitest";
import {
  calculateAgentGasTopUpWei,
  DEFAULT_AGENT_GAS_TARGET_ETH,
  getAgentGasTargetWei,
} from "@/libs/dynamic/gas-tank";

describe("agent gas tank", () => {
  it("uses a small Base Sepolia default target", () => {
    expect(DEFAULT_AGENT_GAS_TARGET_ETH).toBe("0.001");
    expect(getAgentGasTargetWei(DEFAULT_AGENT_GAS_TARGET_ETH)).toBe(
      1_000_000_000_000_000n
    );
  });

  it("tops up only the shortfall", () => {
    expect(
      calculateAgentGasTopUpWei(
        250_000_000_000_000n,
        1_000_000_000_000_000n
      )
    ).toBe(750_000_000_000_000n);
  });

  it("does not send when the target is already met", () => {
    expect(calculateAgentGasTopUpWei(2n, 2n)).toBe(0n);
    expect(calculateAgentGasTopUpWei(3n, 2n)).toBe(0n);
  });

  it("rejects invalid balances and targets", () => {
    expect(() => calculateAgentGasTopUpWei(-1n, 1n)).toThrow();
    expect(() => calculateAgentGasTopUpWei(0n, 0n)).toThrow();
    expect(() => getAgentGasTargetWei("0")).toThrow();
  });
});
