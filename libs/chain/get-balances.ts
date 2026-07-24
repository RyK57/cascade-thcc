import { formatEther, formatUnits, getAddress, isAddress } from "viem";
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

/**
 * Batched balances, keyed by both the EIP-55 checksummed address and whatever
 * string the caller passed in.
 *
 * Callers look up with the address they already hold (env vars and wallet SDKs
 * hand back lowercase forms), so keying only by checksum silently misses.
 * Invalid entries — the simulated treasury placeholder reaches here — are
 * skipped rather than throwing, and a single RPC failure can't void the rest
 * of the batch.
 */
export async function getBalancesForAddresses(
  addresses: string[]
): Promise<Record<string, AddressBalances>> {
  const valid = addresses.filter((a) => isAddress(a, { strict: false }));
  const unique = [...new Set(valid.map((a) => getAddress(a)))];
  const settled = await Promise.allSettled(
    unique.map((a) => getAddressBalances(a))
  );

  const byChecksum = new Map<string, AddressBalances>();
  unique.forEach((address, index) => {
    const result = settled[index];
    if (result.status === "fulfilled") {
      byChecksum.set(address, result.value);
    } else {
      console.warn("[chain] balance lookup failed", address, result.reason);
    }
  });

  const out: Record<string, AddressBalances> = Object.fromEntries(byChecksum);
  for (const original of valid) {
    const value = byChecksum.get(getAddress(original));
    if (value) out[original] = value;
  }
  return out;
}
