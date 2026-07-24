import { USDC_BASE_SEPOLIA, USDC_DECIMALS } from "./usdc";

/**
 * Assets Cascade will quote and settle in. Deliberately just two: a stablecoin
 * so a $12 job costs $12, and native ETH for people who'd rather hold it.
 */
export const PAY_ASSET = {
  usdc: "usdc",
  eth: "eth",
} as const;

export type PayAsset = (typeof PAY_ASSET)[keyof typeof PAY_ASSET];

export const PAY_ASSET_VALUES = [PAY_ASSET.usdc, PAY_ASSET.eth] as const;

interface AssetSpec {
  symbol: string;
  decimals: number;
  /** Contract address, or null for the chain's native asset. */
  address: `0x${string}` | null;
  /** A stablecoin is quoted 1:1 with USD; ETH needs a live rate. */
  isStable: boolean;
  /** Sensible display precision for a human-readable amount. */
  displayPrecision: number;
}

export const ASSET_SPECS: Record<PayAsset, AssetSpec> = {
  [PAY_ASSET.usdc]: {
    symbol: "USDC",
    decimals: USDC_DECIMALS,
    address: USDC_BASE_SEPOLIA as `0x${string}`,
    isStable: true,
    displayPrecision: 2,
  },
  [PAY_ASSET.eth]: {
    symbol: "ETH",
    decimals: 18,
    address: null,
    isStable: false,
    displayPrecision: 6,
  },
};

export function isPayAsset(value: string): value is PayAsset {
  return (PAY_ASSET_VALUES as readonly string[]).includes(value);
}

export function assetSpec(asset: PayAsset): AssetSpec {
  return ASSET_SPECS[asset];
}

/** "$12.00" */
export function formatUsd(cents: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(cents / 100);
}

/**
 * Trim a fixed-precision amount without turning a small non-zero value into
 * "0" — 0.0000004 ETH should read as "<0.000001", not as free.
 */
export function formatAssetAmount(amount: number, asset: PayAsset): string {
  const { displayPrecision, symbol } = assetSpec(asset);
  if (amount > 0 && amount < 10 ** -displayPrecision) {
    return `<${(10 ** -displayPrecision).toFixed(displayPrecision)} ${symbol}`;
  }
  const fixed = amount.toFixed(displayPrecision);
  const trimmed = fixed.includes(".")
    ? fixed.replace(/0+$/, "").replace(/\.$/, "")
    : fixed;
  return `${trimmed} ${symbol}`;
}
