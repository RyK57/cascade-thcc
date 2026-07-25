import type { DynamicEvmWalletClient } from "@dynamic-labs-wallet/node-evm";
import { getDynamicEnvironmentId } from "./config";

/**
 * Server-side agent wallet (Dynamic track: "give an AI agent its own wallet").
 *
 * IMPORTANT: `@dynamic-labs-wallet/node` ships a native binary (darwin/linux
 * only — NOT win32). The SDK is therefore lazy-imported inside functions; this
 * module can be imported anywhere, but wallet operations only run on
 * macOS/Linux/Vercel.
 *
 * Env (all server-only):
 * - DYNAMIC_API_TOKEN / DYNAMIC_API_KEY   dashboard API token
 * - AGENT_WALLET_METADATA                 walletMetadata JSON printed by `pnpm agent:create-wallet`
 * - AGENT_WALLET_KEY_SHARES               optional MPC shares for sponsored payouts
 * - AGENT_WALLET_PASSWORD                 password used when the wallet was created
 * - BASE_SEPOLIA_RPC_URL                  optional, defaults to the public Base Sepolia RPC
 */
export const BASE_SEPOLIA_CHAIN_ID = 84532;

export function getBaseSepoliaRpcUrl(): string {
  return process.env.BASE_SEPOLIA_RPC_URL?.trim() || "https://sepolia.base.org";
}

function getDynamicApiToken(): string | undefined {
  return (
    process.env.DYNAMIC_API_TOKEN?.trim() ||
    process.env.DYNAMIC_API_KEY?.trim() ||
    undefined
  );
}

type WalletMetadata = Parameters<
  DynamicEvmWalletClient["getWalletClient"]
>[0]["walletMetadata"];

export function getAgentWalletMetadata(): WalletMetadata | undefined {
  const raw = process.env.AGENT_WALLET_METADATA?.trim();
  if (!raw) return undefined;
  try {
    return JSON.parse(raw) as WalletMetadata;
  } catch {
    return undefined;
  }
}

/**
 * Optional plaintext MPC shares for sponsored / server signing.
 * Prefer this over round-tripping Dynamic backup recovery on every payout.
 * Create via `pnpm agent:create-wallet` (prints AGENT_WALLET_KEY_SHARES).
 */
export function getAgentWalletKeyShares(): unknown[] | undefined {
  const raw = process.env.AGENT_WALLET_KEY_SHARES?.trim();
  if (!raw) return undefined;
  try {
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? parsed : undefined;
  } catch {
    return undefined;
  }
}

/** The agent wallet's public address, derived from its metadata. */
export function getAgentWalletAddress(): string | undefined {
  return getAgentWalletMetadata()?.accountAddress;
}

export function isAgentWalletConfigured(): boolean {
  return Boolean(
    getDynamicEnvironmentId() && getDynamicApiToken() && getAgentWalletMetadata()
  );
}

let authenticatedClient: Promise<DynamicEvmWalletClient> | null = null;

/** Authenticated Dynamic EVM client, memoized per server instance. */
export function getAgentEvmClient(): Promise<DynamicEvmWalletClient> {
  if (!authenticatedClient) {
    authenticatedClient = (async () => {
      const environmentId = getDynamicEnvironmentId();
      const apiToken = getDynamicApiToken();
      if (!environmentId || !apiToken) {
        throw new Error(
          "Agent wallet is not configured. Set NEXT_PUBLIC_DYNAMIC_ENVIRONMENT_ID and DYNAMIC_API_KEY."
        );
      }
      // Lazy import: native module, darwin/linux only.
      const { DynamicEvmWalletClient: Client } = await import(
        "@dynamic-labs-wallet/node-evm"
      );
      const client = new Client({ environmentId });
      await client.authenticateApiToken(apiToken);
      return client;
    })();
    // Allow retry on the next call if authentication fails.
    authenticatedClient.catch(() => {
      authenticatedClient = null;
    });
  }
  return authenticatedClient;
}

/** Viem WalletClient bound to the agent's wallet on Base Sepolia. */
export async function getAgentWalletClient() {
  const walletMetadata = getAgentWalletMetadata();
  if (!walletMetadata) {
    throw new Error(
      "Agent wallet is not configured. Set AGENT_WALLET_METADATA (run `pnpm agent:create-wallet`)."
    );
  }
  const client = await getAgentEvmClient();
  const keyShares = getAgentWalletKeyShares();
  return client.getWalletClient({
    walletMetadata,
    chainId: BASE_SEPOLIA_CHAIN_ID,
    rpcUrl: getBaseSepoliaRpcUrl(),
    ...(keyShares ? { externalServerKeyShares: keyShares } : {}),
    ...(process.env.AGENT_WALLET_PASSWORD?.trim()
      ? { password: process.env.AGENT_WALLET_PASSWORD.trim() }
      : {}),
  });
}
