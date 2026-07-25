import type { NetworkData } from "@dynamic-labs-sdk/client";
import {
  BASE_SEPOLIA_CHAIN_ID,
  BASE_SEPOLIA_EXPLORER,
  getSandboxRpcUrl,
} from "./sandbox";

/** Dynamic networkId for Base Sepolia (EVM chain id as string). */
export const BASE_SEPOLIA_NETWORK_ID = String(BASE_SEPOLIA_CHAIN_ID);

/**
 * Canonical Base Sepolia network config for the Dynamic client.
 * Injected when the dashboard list is missing it so WaaS wallets still have
 * RPC + chain metadata (`No network data found for wallet account …`).
 */
export function baseSepoliaNetworkData(): NetworkData {
  const rpc =
    getSandboxRpcUrl() ||
    process.env.NEXT_PUBLIC_BASE_SEPOLIA_RPC_URL?.trim() ||
    "https://sepolia.base.org";

  return {
    blockExplorerUrls: [BASE_SEPOLIA_EXPLORER],
    chain: "EVM",
    displayName: "Base Sepolia",
    iconUrl: "",
    name: "base-sepolia",
    nativeCurrency: {
      decimals: 18,
      name: "Ether",
      symbol: "ETH",
    },
    networkId: BASE_SEPOLIA_NETWORK_ID,
    rpcUrls: { http: [rpc] },
    testnet: true,
  };
}

/**
 * Cascade is Base Sepolia–only for EVM. Keep Base Sepolia first (SDK default
 * for wallets with no saved selection) and drop other EVM nets that leave
 * embedded wallets on mainnet with no matching network data.
 */
export function withBaseSepoliaFirst(networks: NetworkData[]): NetworkData[] {
  const fromDashboard = networks.find(
    (n) => n.networkId === BASE_SEPOLIA_NETWORK_ID
  );
  const sepolia = fromDashboard
    ? {
        ...fromDashboard,
        // Prefer our sandbox RPC when the dashboard entry has none.
        rpcUrls: {
          http:
            fromDashboard.rpcUrls.http.length > 0
              ? fromDashboard.rpcUrls.http
              : baseSepoliaNetworkData().rpcUrls.http,
        },
      }
    : baseSepoliaNetworkData();

  const nonEvm = networks.filter(
    (n) => n.chain !== "EVM" && n.networkId !== BASE_SEPOLIA_NETWORK_ID
  );

  return [sepolia, ...nonEvm];
}
