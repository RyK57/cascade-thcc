/** Base Sepolia — Cascade never uses mainnet. */
export const BASE_SEPOLIA_CHAIN_ID = 84532;

/**
 * Closed-loop sandbox balance granted to every new account (credits ≈ USD).
 * Not on-chain USDC — spendable via "pay with balance" / heart-approval.
 */
export const SANDBOX_STARTING_CREDITS = 100;

/** Circle test USDC on Base Sepolia (public faucet token). */
export const BASE_SEPOLIA_USDC_ADDRESS =
  process.env.DYNAMIC_SANDBOX_USDC_ADDRESS?.trim() ||
  "0x036CbD53842c5426634e7929541eC2318f3dCF7e";

export const BASE_SEPOLIA_EXPLORER = "https://sepolia.basescan.org";

export function getSandboxRpcUrl(): string | undefined {
  return process.env.DYNAMIC_SANDBOX_RPC_URL?.trim() || undefined;
}

export function isDynamicSandboxConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_DYNAMIC_ENVIRONMENT_ID?.trim() &&
      process.env.DYNAMIC_API_KEY?.trim()
  );
}

export function isServerWalletConfigured(): boolean {
  return Boolean(
    isDynamicSandboxConfigured() &&
      process.env.DYNAMIC_SERVER_KEY_SHARES?.trim() &&
      process.env.DYNAMIC_TREASURY_PASSWORD?.trim()
  );
}

export function explorerTxUrl(txHash: string): string {
  return `${BASE_SEPOLIA_EXPLORER}/tx/${txHash}`;
}

export function explorerAddressUrl(address: string): string {
  return `${BASE_SEPOLIA_EXPLORER}/address/${address}`;
}
