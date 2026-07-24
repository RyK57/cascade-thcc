import { beforeEach, describe, expect, it, vi } from "vitest";

const getBalance = vi.fn();
const readContract = vi.fn();

vi.mock("@/libs/chain/public-client", () => ({
  getPublicClient: () => ({ getBalance, readContract }),
}));

import { getAddressBalances, getBalancesForAddresses } from "@/libs/chain/get-balances";

const ADDR = "0x036CbD53842c5426634e7929541eC2318f3dCF7e";
const ADDR_2 = "0x1111111111111111111111111111111111111111";

beforeEach(() => {
  getBalance.mockReset().mockResolvedValue(1_500_000_000_000_000_000n); // 1.5 ETH
  readContract.mockReset().mockResolvedValue(3_250_000n); // 3.25 USDC
});

describe("getAddressBalances", () => {
  it("formats wei and USDC units as decimal strings", async () => {
    const balances = await getAddressBalances(ADDR);
    expect(balances).toEqual({ eth: "1.5", usdc: "3.25" });
  });

  it("caches results briefly (no second RPC call)", async () => {
    await getAddressBalances(ADDR);
    const callsAfterFirst = getBalance.mock.calls.length;
    await getAddressBalances(ADDR);
    expect(getBalance.mock.calls.length).toBe(callsAfterFirst);
  });

  it("rejects invalid addresses", async () => {
    await expect(getAddressBalances("not-an-address")).rejects.toThrow();
  });
});

describe("getBalancesForAddresses", () => {
  it("returns a record keyed by checksummed address", async () => {
    const result = await getBalancesForAddresses([ADDR_2]);
    const keys = Object.keys(result);
    expect(keys).toHaveLength(1);
    expect(keys[0].toLowerCase()).toBe(ADDR_2.toLowerCase());
    expect(result[keys[0]].usdc).toBe("3.25");
  });

  it("is also keyed by the caller's original casing", async () => {
    // Callers look up with the string they hold (env vars, wallet SDKs), which
    // is often lowercase — checksum-only keys would silently miss.
    const lowercase = ADDR.toLowerCase();
    const result = await getBalancesForAddresses([lowercase]);
    expect(result[lowercase]?.usdc).toBe("3.25");
    expect(result[ADDR]?.usdc).toBe("3.25");
  });

  it("skips invalid addresses instead of voiding the whole batch", async () => {
    // The simulated treasury placeholder is not a real address.
    const result = await getBalancesForAddresses([
      "0xCascadeSandboxTreasury000000000000001",
      ADDR_2,
    ]);
    expect(result[ADDR_2]?.usdc).toBe("3.25");
    expect(result["0xCascadeSandboxTreasury000000000000001"]).toBeUndefined();
  });

  it("keeps good balances when one address's RPC read fails", async () => {
    // Addresses unique to this test — getAddressBalances memoizes for ~2s.
    const failing = "0x2222222222222222222222222222222222222222";
    const working = "0x3333333333333333333333333333333333333333";
    getBalance
      .mockReset()
      .mockImplementation(async ({ address }: { address: string }) =>
        address.toLowerCase() === failing
          ? Promise.reject(new Error("rpc down"))
          : 1_500_000_000_000_000_000n
      );

    const result = await getBalancesForAddresses([failing, working]);
    expect(result[failing]).toBeUndefined();
    expect(result[working]?.usdc).toBe("3.25");
  });
});
