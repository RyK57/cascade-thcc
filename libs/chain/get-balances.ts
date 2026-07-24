import { formatEther, formatUnits, getAddress } from "viem";
import { ERC20_TRANSFER_ABI, USDC_BASE_SEPOLIA, USDC_DECIMALS } from "@/libs/dynamic/usdc";
import { getPublicClient } from "./public-client";

export interface AddressBalances {
  /** Decimal strings — bigint must never reach NextResponse.json. */
  eth: string;
  usdc: string;
}

const CACHE_TTL_MS = 2_000;
const cache = new Map<string, { at: number; value: AddressBalances }>();

/** ETH + USDC balances for one address, memoized ~2s to protect the public RPC. */
export async function getAddressBalances(address: string): Promise<AddressBalances> {
  const key = getAddress(address); // checksums + validates
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < CACHE_TTL_MS) return hit.value;

  const client = getPublicClient();
  const [wei, usdcUnits] = await Promise.all([
    client.getBalance({ address: key }),
    client.readContract({
      address: USDC_BASE_SEPOLIA,
      abi: ERC20_TRANSFER_ABI,
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

/** Batched balances keyed by the original (checksummed) address. */
export async function getBalancesForAddresses(
  addresses: string[]
): Promise<Record<string, AddressBalances>> {
  const unique = [...new Set(addresses.map((a) => getAddress(a)))];
  const results = await Promise.all(unique.map((a) => getAddressBalances(a)));
  return Object.fromEntries(unique.map((a, i) => [a, results[i]]));
}
