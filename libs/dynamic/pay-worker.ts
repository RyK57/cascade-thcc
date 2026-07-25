import { encodeFunctionData, isAddress } from "viem";
import {
  BASE_SEPOLIA_CHAIN_ID,
  getAgentEvmClient,
  getAgentWalletClient,
  getAgentWalletKeyShares,
  getAgentWalletMetadata,
  getBaseSepoliaRpcUrl,
} from "./agent-wallet";
import { isSponsorshipUnavailable } from "./is-sponsorship-unavailable";
import {
  shouldSimulateSandboxPayments,
  simulatedSandboxTxHash,
} from "./sandbox-payments";
import {
  ERC20_TRANSFER_ABI,
  explorerTxUrl,
  USDC_BASE_SEPOLIA,
  usdcUnitsFromCents,
} from "./usdc";

export interface PayWorkerInput {
  /** Worker's EVM address. */
  to: string;
  amountCents: number;
}

export interface PayWorkerResult {
  txHash: string;
  explorerUrl: string;
  /** True when no on-chain transfer was broadcast (demo sandbox). */
  simulated?: boolean;
}

/**
 * Autonomous payout: the agent's own wallet sends testnet USDC to the worker.
 *
 * Default is simulated — Dynamic gas sponsorship is currently unusable here.
 * Real path (opt-in via DYNAMIC_REAL_CHAIN_PAYMENTS=1): sponsored first, then
 * self-funded. Gas/sponsorship failures fall back to simulation so the demo
 * loop never hard-stops on viem gas errors.
 */
export async function payWorkerUsdc({
  to,
  amountCents,
}: PayWorkerInput): Promise<PayWorkerResult> {
  if (!isAddress(to)) {
    throw new Error(`Invalid worker address: ${to}`);
  }

  if (shouldSimulateSandboxPayments()) {
    const txHash = simulatedSandboxTxHash();
    return {
      txHash,
      explorerUrl: explorerTxUrl(txHash),
      simulated: true,
    };
  }

  const walletMetadata = getAgentWalletMetadata();
  if (!walletMetadata) {
    throw new Error(
      "Agent wallet is not configured. Set AGENT_WALLET_METADATA (run `pnpm agent:create-wallet`)."
    );
  }

  const transferData = encodeFunctionData({
    abi: ERC20_TRANSFER_ABI,
    functionName: "transfer",
    args: [to, usdcUnitsFromCents(amountCents)],
  });
  const target = USDC_BASE_SEPOLIA as `0x${string}`;
  const password = process.env.AGENT_WALLET_PASSWORD?.trim();
  const keyShares = getAgentWalletKeyShares();

  const client = await getAgentEvmClient();
  try {
    const { transactionHash } = await client.sendSponsoredTransaction({
      walletMetadata,
      ...(keyShares ? { externalServerKeyShares: keyShares } : {}),
      ...(password ? { password } : {}),
      autoDelegate: true,
      chainId: BASE_SEPOLIA_CHAIN_ID,
      rpcUrl: getBaseSepoliaRpcUrl(),
      calls: [{ target, data: transferData, value: BigInt(0) }],
    });
    return {
      txHash: transactionHash as string,
      explorerUrl: explorerTxUrl(transactionHash as string),
    };
  } catch (error) {
    // Only fall back when sponsorship itself is off — ambiguous network errors
    // can follow a broadcast that already landed; retrying would double-pay.
    if (!isSponsorshipUnavailable(error)) throw error;
    console.warn(
      "[dynamic] agent sponsored tx unavailable; trying self-funded",
      error
    );
  }

  try {
    const wallet = await getAgentWalletClient();
    const txHash = await wallet.sendTransaction({
      to: target,
      data: transferData,
      value: BigInt(0),
    });
    return { txHash, explorerUrl: explorerTxUrl(txHash) };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (/gas required exceeds allowance|insufficient funds/i.test(message)) {
      console.warn(
        "[dynamic] agent self-funded payout failed on gas; simulating",
        error
      );
      const txHash = simulatedSandboxTxHash();
      return {
        txHash,
        explorerUrl: explorerTxUrl(txHash),
        simulated: true,
      };
    }
    throw error;
  }
}
