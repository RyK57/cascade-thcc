import { describe, expect, it } from "vitest";
import type { NetworkData } from "@dynamic-labs-sdk/client";
import {
  BASE_SEPOLIA_NETWORK_ID,
  withBaseSepoliaFirst,
} from "@/libs/dynamic/base-sepolia-network";

function network(partial: Partial<NetworkData> & { networkId: string }): NetworkData {
  return {
    blockExplorerUrls: [],
    chain: "EVM",
    displayName: partial.networkId,
    iconUrl: "",
    name: partial.networkId,
    nativeCurrency: { decimals: 18, name: "Ether", symbol: "ETH" },
    rpcUrls: { http: ["https://example.invalid"] },
    testnet: true,
    ...partial,
  };
}

describe("withBaseSepoliaFirst", () => {
  it("injects Base Sepolia when the dashboard list omits it", () => {
    const result = withBaseSepoliaFirst([
      network({ networkId: "1", displayName: "Ethereum", testnet: false }),
    ]);

    expect(result).toHaveLength(1);
    expect(result[0]?.networkId).toBe(BASE_SEPOLIA_NETWORK_ID);
    expect(result[0]?.displayName).toBe("Base Sepolia");
  });

  it("pins an existing Base Sepolia entry first and drops other EVM nets", () => {
    const result = withBaseSepoliaFirst([
      network({ networkId: "1", displayName: "Ethereum", testnet: false }),
      network({
        networkId: BASE_SEPOLIA_NETWORK_ID,
        displayName: "Base Sepolia (dashboard)",
        rpcUrls: { http: ["https://custom.rpc"] },
      }),
    ]);

    expect(result.map((n) => n.networkId)).toEqual([BASE_SEPOLIA_NETWORK_ID]);
    expect(result[0]?.rpcUrls.http).toEqual(["https://custom.rpc"]);
  });
});
