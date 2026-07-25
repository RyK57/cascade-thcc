import { beforeEach, describe, expect, it, vi } from "vitest";

const sendSponsoredTransaction = vi.fn();
const sendTransaction = vi.fn();
const getAgentEvmClient = vi.fn(async () => ({ sendSponsoredTransaction }));
const getAgentWalletClient = vi.fn(async () => ({ sendTransaction }));
const getAgentWalletMetadata = vi.fn();
const getAgentWalletKeyShares = vi.fn();

vi.mock("@/libs/dynamic/agent-wallet", () => ({
  BASE_SEPOLIA_CHAIN_ID: 84532,
  getBaseSepoliaRpcUrl: () => "https://sepolia.base.org",
  getAgentEvmClient: (...args: unknown[]) => getAgentEvmClient(...args),
  getAgentWalletClient: (...args: unknown[]) => getAgentWalletClient(...args),
  getAgentWalletMetadata: (...args: unknown[]) => getAgentWalletMetadata(...args),
  getAgentWalletKeyShares: (...args: unknown[]) => getAgentWalletKeyShares(...args),
}));

import { payWorkerUsdc } from "@/libs/dynamic/pay-worker";

const WORKER = "0x8332f7007cd6082541b9e91d02470cfd3c8de2d6";
const AGENT_META = {
  accountAddress: "0x3ab7A0d64774708478F5cD66a13078d00F493896",
};

beforeEach(() => {
  vi.clearAllMocks();
  getAgentWalletMetadata.mockReturnValue(AGENT_META);
  getAgentWalletKeyShares.mockReturnValue([{ share: "demo" }]);
  process.env.AGENT_WALLET_PASSWORD = "demo-password";
});

describe("payWorkerUsdc sponsored path", () => {
  it("sends a sponsored USDC transfer when sponsorship works", async () => {
    sendSponsoredTransaction.mockResolvedValue({
      transactionHash: "0xsponsored",
    });

    const result = await payWorkerUsdc({ to: WORKER, amountCents: 1200 });

    expect(result.txHash).toBe("0xsponsored");
    expect(result.explorerUrl).toContain("0xsponsored");
    expect(sendSponsoredTransaction).toHaveBeenCalledWith(
      expect.objectContaining({
        walletMetadata: AGENT_META,
        externalServerKeyShares: [{ share: "demo" }],
        password: "demo-password",
        autoDelegate: true,
        chainId: 84532,
        calls: [
          expect.objectContaining({
            target: "0x036CbD53842c5426634e7929541eC2318f3dCF7e",
            value: 0n,
          }),
        ],
      })
    );
    expect(getAgentWalletClient).not.toHaveBeenCalled();
  });

  it("falls back to self-funded send when sponsorship is unavailable", async () => {
    sendSponsoredTransaction.mockRejectedValue(
      new Error("Gas sponsorship is not enabled")
    );
    sendTransaction.mockResolvedValue("0xself");

    const result = await payWorkerUsdc({ to: WORKER, amountCents: 100 });

    expect(result.txHash).toBe("0xself");
    expect(getAgentWalletClient).toHaveBeenCalled();
    expect(sendTransaction).toHaveBeenCalled();
  });

  it("does not double-send when the sponsored failure is ambiguous", async () => {
    sendSponsoredTransaction.mockRejectedValue(new Error("Request timed out"));

    await expect(
      payWorkerUsdc({ to: WORKER, amountCents: 100 })
    ).rejects.toThrow(/timed out/i);
    expect(getAgentWalletClient).not.toHaveBeenCalled();
  });

  it("explains missing gas ETH after sponsorship fallback fails", async () => {
    sendSponsoredTransaction.mockRejectedValue(
      new Error("paymaster unsupported for chain")
    );
    sendTransaction.mockRejectedValue(
      new Error("gas required exceeds allowance (0)")
    );

    await expect(
      payWorkerUsdc({ to: WORKER, amountCents: 100 })
    ).rejects.toThrow(/no Base Sepolia ETH for gas/i);
  });

  it("rejects invalid worker addresses before touching the wallet", async () => {
    await expect(
      payWorkerUsdc({ to: "not-an-address", amountCents: 100 })
    ).rejects.toThrow(/Invalid worker address/);
    expect(getAgentEvmClient).not.toHaveBeenCalled();
  });
});
