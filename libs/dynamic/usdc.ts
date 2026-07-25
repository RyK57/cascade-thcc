import { parseAbi } from "viem";

/**
 * Shared USDC-on-Base-Sepolia constants + pure helpers.
 * Client-safe: no imports of the Node-only agent wallet.
 */

/** Circle's official USDC on Base Sepolia (6 decimals). */
export const USDC_BASE_SEPOLIA =
  process.env.DYNAMIC_SANDBOX_USDC_ADDRESS?.trim() ||
  "0x036CbD53842c5426634e7929541eC2318f3dCF7e";

export const USDC_DECIMALS = 6;

export const ERC20_TRANSFER_ABI = parseAbi([
  "function transfer(address to, uint256 amount) returns (bool)",
  "function balanceOf(address owner) view returns (uint256)",
]);

/** Payments are stored in cents; USDC has 6 decimals → 1 cent = 10^4 units. */
export function usdcUnitsFromCents(amountCents: number): bigint {
  if (!Number.isInteger(amountCents) || amountCents <= 0) {
    throw new Error(`Invalid amountCents: ${amountCents}`);
  }
  return BigInt(amountCents) * 10_000n;
}

/** "1234567" units → "1.234567" for display. */
export function formatUsdcUnits(units: bigint): string {
  const negative = units < 0n;
  const abs = negative ? -units : units;
  const whole = abs / 1_000_000n;
  const frac = (abs % 1_000_000n).toString().padStart(6, "0").replace(/0+$/, "");
  return `${negative ? "-" : ""}${whole}${frac ? `.${frac}` : ""}`;
}

export function explorerTxUrl(hash: string): string {
  return `https://sepolia.basescan.org/tx/${hash}`;
}

export function explorerAddressUrl(address: string): string {
  return `https://sepolia.basescan.org/address/${address}`;
}
