import { beforeEach, describe, expect, it, vi } from "vitest";

const getActiveNetworkId = vi.fn();
const switchActiveNetwork = vi.fn();
const addNetwork = vi.fn();
const getNetworksData = vi.fn(() => []);

vi.mock("@dynamic-labs-sdk/client", () => {
  class NetworkNotAddedError extends Error {
    networkData: unknown;
    constructor(networkData: unknown) {
      super("not added");
      this.name = "NetworkNotAddedError";
      this.networkData = networkData;
    }
  }
  return {
    getActiveNetworkId: (...args: unknown[]) => getActiveNetworkId(...args),
    switchActiveNetwork: (...args: unknown[]) => switchActiveNetwork(...args),
    addNetwork: (...args: unknown[]) => addNetwork(...args),
    getNetworksData: (...args: unknown[]) => getNetworksData(...args),
    NetworkNotAddedError,
  };
});

import { NetworkNotAddedError } from "@dynamic-labs-sdk/client";
import { ensureBaseSepolia } from "@/libs/dynamic/ensure-base-sepolia";
import { BASE_SEPOLIA_NETWORK_ID } from "@/libs/dynamic/base-sepolia-network";

const walletAccount = { address: "0xabc", chain: "EVM" } as never;

describe("ensureBaseSepolia", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("no-ops when already on Base Sepolia", async () => {
    getActiveNetworkId.mockResolvedValue({ networkId: BASE_SEPOLIA_NETWORK_ID });

    await ensureBaseSepolia(walletAccount);

    expect(switchActiveNetwork).not.toHaveBeenCalled();
  });

  it("switches when the wallet is on another network", async () => {
    getActiveNetworkId.mockResolvedValue({ networkId: "1" });
    switchActiveNetwork.mockResolvedValue(undefined);

    await ensureBaseSepolia(walletAccount);

    expect(switchActiveNetwork).toHaveBeenCalledWith({
      walletAccount,
      networkId: BASE_SEPOLIA_NETWORK_ID,
    });
  });

  it("adds then switches when the network is missing from the wallet", async () => {
    getActiveNetworkId.mockResolvedValue({ networkId: "1" });
    const networkData = { networkId: BASE_SEPOLIA_NETWORK_ID };
    switchActiveNetwork
      .mockRejectedValueOnce(new NetworkNotAddedError(networkData))
      .mockResolvedValueOnce(undefined);
    addNetwork.mockResolvedValue(undefined);

    await ensureBaseSepolia(walletAccount);

    expect(addNetwork).toHaveBeenCalledWith({
      walletAccount,
      networkData,
    });
    expect(switchActiveNetwork).toHaveBeenCalledTimes(2);
  });
});
