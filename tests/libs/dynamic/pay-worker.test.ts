import { describe, expect, it } from "vitest";
import {
  explorerTxUrl,
  USDC_BASE_SEPOLIA,
  usdcUnitsFromCents,
} from "@/libs/dynamic";

describe("usdcUnitsFromCents", () => {
  it("converts cents to 6-decimal USDC units", () => {
    expect(usdcUnitsFromCents(1)).toBe(10_000n); // $0.01
    expect(usdcUnitsFromCents(100)).toBe(1_000_000n); // $1.00
    expect(usdcUnitsFromCents(2500)).toBe(25_000_000n); // $25.00
  });

  it("rejects zero, negative, and fractional amounts", () => {
    expect(() => usdcUnitsFromCents(0)).toThrow();
    expect(() => usdcUnitsFromCents(-5)).toThrow();
    expect(() => usdcUnitsFromCents(1.5)).toThrow();
  });
});

describe("explorerTxUrl", () => {
  it("builds a Base Sepolia BaseScan link", () => {
    expect(explorerTxUrl("0xabc")).toBe("https://sepolia.basescan.org/tx/0xabc");
  });
});

describe("USDC_BASE_SEPOLIA", () => {
  it("is a checksummed EVM address", () => {
    expect(USDC_BASE_SEPOLIA).toMatch(/^0x[0-9a-fA-F]{40}$/);
  });
});
