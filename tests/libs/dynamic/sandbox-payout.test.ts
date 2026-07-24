import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/db/treasury", () => ({
  getTreasuryWallet: vi.fn(async () => null),
  upsertTreasuryWallet: vi.fn(async (input: { address: string }) => ({
    id: "tr_1",
    address: input.address,
    chainId: 84532,
  })),
}));

vi.mock("@/db/payouts", () => ({
  createPayout: vi.fn(async (input: { txHash: string; status: string }) => ({
    id: "po_1",
    jobId: "job_1",
    txHash: input.txHash,
    amountUsdcCents: 1200,
    status: input.status,
    createdAt: "2026-07-24T00:00:00.000Z",
  })),
}));

import {
  isSponsorshipUnavailable,
  payoutFromTreasury,
} from "@/libs/dynamic/treasury";
import { createPayout } from "@/db/payouts";

beforeEach(() => {
  vi.clearAllMocks();
  delete process.env.DYNAMIC_SERVER_KEY_SHARES;
  delete process.env.DYNAMIC_TREASURY_PASSWORD;
});

describe("payoutFromTreasury", () => {
  it("simulates a sandbox payout when server wallet is not configured", async () => {
    const result = await payoutFromTreasury({
      jobId: "job_1",
      toAddress: "0xpeer",
      amountUsdcCents: 1200,
    });

    expect(result.status).toBe("simulated");
    expect(result.txHash.startsWith("0xsim")).toBe(true);
    expect(result.explorerUrl).toContain("sepolia.basescan.org");
    expect(createPayout).toHaveBeenCalledWith(
      expect.objectContaining({ status: "simulated" })
    );
  });
});

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
    // These can all follow a transaction that actually landed — retrying
    // would send the USDC twice.
    expect(isSponsorshipUnavailable(new Error("Request timed out"))).toBe(false);
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
