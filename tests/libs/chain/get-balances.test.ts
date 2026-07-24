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
  getBalance.mockReset().mockResolvedValue(BigInt("1500000000000000000")); // 1.5 ETH
  readContract.mockReset().mockResolvedValue(BigInt("3250000")); // 3.25 USDC
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

  it("resolves invalid addresses (simulated treasury) to zero balances", async () => {
    const balances = await getAddressBalances("0xCascadeSandboxTreasury000000000000001");
    expect(balances).toEqual({ eth: "0", usdc: "0" });
    expect(getBalance).not.toHaveBeenCalled();
  });
});

describe("getBalancesForAddresses", () => {
  it("returns a record keyed by input address", async () => {
    const result = await getBalancesForAddresses([ADDR_2]);
    expect(result[ADDR_2]).toEqual({ eth: "1.5", usdc: "3.25" });
  });
});
