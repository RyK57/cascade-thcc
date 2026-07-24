/**
 * Live ETH/USD spot, used to tell someone what an ETH quote actually costs
 * them ("0.0421 ETH ≈ $180.00").
 *
 * Why not Dynamic: the SDK does expose prices, via
 * `getTokenBalances({ walletAccount, includePrices: true })` → `TokenBalance.price`.
 * But it is wallet-scoped and client-side, and the agent writes this quote into
 * iMessage server-side before any wallet is connected to that turn. It also
 * prices tokens on the network you query, and ours is Base Sepolia — testnet
 * ETH is not worth what the requester is actually being asked to send. So the
 * conversational quote uses real spot here, and the checkout UI (where a wallet
 * *is* connected) reads Dynamic's own numbers.
 *
 * Public endpoint, no key. Memoized briefly so a burst of quotes in one thread
 * doesn't hammer it, and every failure path returns null — a quote with no USD
 * estimate is fine, a quote with a wrong one is not.
 */

const SPOT_URL = "https://api.coinbase.com/v2/prices/ETH-USD/spot";
const CACHE_TTL_MS = 60_000;
const TIMEOUT_MS = 3_000;

let cache: { at: number; usd: number } | null = null;

export function __resetEthPriceCache(): void {
  cache = null;
}

export async function getEthUsdPrice(): Promise<number | null> {
  if (cache && Date.now() - cache.at < CACHE_TTL_MS) return cache.usd;

  try {
    const response = await fetch(SPOT_URL, {
      signal: AbortSignal.timeout(TIMEOUT_MS),
      headers: { accept: "application/json" },
    });
    if (!response.ok) return null;

    const body = (await response.json()) as { data?: { amount?: string } };
    const usd = Number(body.data?.amount);
    if (!Number.isFinite(usd) || usd <= 0) return null;

    cache = { at: Date.now(), usd };
    return usd;
  } catch {
    // Offline, rate limited, or slow — quote without the USD estimate.
    return null;
  }
}

/** USD cents → ETH, or null when no rate is available. */
export function centsToEth(cents: number, ethUsd: number): number {
  return cents / 100 / ethUsd;
}
