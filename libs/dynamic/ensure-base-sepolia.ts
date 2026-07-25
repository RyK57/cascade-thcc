import {
  addNetwork,
  getActiveNetworkId,
  getNetworksData,
  NetworkNotAddedError,
  switchActiveNetwork,
  type WalletAccount,
} from "@dynamic-labs-sdk/client";
import {
  BASE_SEPOLIA_NETWORK_ID,
  baseSepoliaNetworkData,
} from "./base-sepolia-network";

const DASHBOARD_HINT =
  "Enable Base Sepolia in the Dynamic dashboard: Chains & Networks → testnets → Base Sepolia. https://app.dynamic.xyz/dashboard/chains-and-networks";

/**
 * Point a Dynamic EVM wallet at Base Sepolia before creating a viem client or
 * sending USDC. Missing network metadata is what surfaces as
 * `No network data found for wallet account 0x…`.
 */
export async function ensureBaseSepolia(
  walletAccount: WalletAccount
): Promise<void> {
  const networks = getNetworksData();
  const sepolia =
    networks.find((n) => n.networkId === BASE_SEPOLIA_NETWORK_ID) ??
    baseSepoliaNetworkData();

  try {
    const active = await getActiveNetworkId({ walletAccount });
    if (active.networkId === BASE_SEPOLIA_NETWORK_ID) return;
  } catch {
    // No active network yet — fall through and switch.
  }

  try {
    await switchActiveNetwork({
      walletAccount,
      networkId: BASE_SEPOLIA_NETWORK_ID,
    });
    return;
  } catch (error) {
    if (error instanceof NetworkNotAddedError) {
      await addNetwork({
        walletAccount,
        networkData: error.networkData ?? sepolia,
      });
      await switchActiveNetwork({
        walletAccount,
        networkId: BASE_SEPOLIA_NETWORK_ID,
      });
      return;
    }

    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`${DASHBOARD_HINT} (${message})`);
  }
}
