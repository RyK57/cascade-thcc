import { erc20Abi, formatEther, formatUnits, getAddress, isAddress } from "viem";
import { BASE_SEPOLIA_USDC_ADDRESS } from "@/libs/dynamic/sandbox";
import { getPublicClient } from "./public-client";

export interface AddressBalances {
  /** Decimal strings — bigint must never reach NextResponse.json. */
  eth: string;
  usdc: string;
}

const USDC_DECIMALS = 6;
const CACHE_TTL_MS = 2_000;
const cache = new Map<string, { at: number; value: AddressBalances }>();

const ZERO: AddressBalances = { eth: "0", usdc: "0" };

/**
 * ETH + USDC balances for one address, memoized ~2s to protect the public RPC.
 * Non-hex addresses (e.g. the simulated sandbox treasury placeholder) resolve
 * to zero balances instead of throwing — the canvas still renders.
 */
export async function getAddressBalances(address: string): Promise<AddressBalances> {
  if (!isAddress(address)) return ZERO;
  const key = getAddress(address);
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < CACHE_TTL_MS) return hit.value;

  const client = getPublicClient();
  const [wei, usdcUnits] = await Promise.all([
    client.getBalance({ address: key }),
    client.readContract({
      address: BASE_SEPOLIA_USDC_ADDRESS as `0x${string}`,
      abi: erc20Abi,
      functionName: "balanceOf",
      args: [key],
    }),
  ]);

  const value: AddressBalances = {
    eth: formatEther(wei),
    usdc: formatUnits(usdcUnits, USDC_DECIMALS),
  };
  cache.set(key, { at: Date.now(), value });
  return value;
}

/** Batched balances keyed by input address (checksummed when valid). */
export async function getBalancesForAddresses(
  addresses: string[]
): Promise<Record<string, AddressBalances>> {
  const unique = [...new Set(addresses)];
  const results = await Promise.all(unique.map((a) => getAddressBalances(a)));
  return Object.fromEntries(unique.map((a, i) => [a, results[i]]));
}
