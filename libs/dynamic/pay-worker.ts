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
}

/**
 * Autonomous payout: the agent's own wallet sends testnet USDC to the worker.
 *
 * Prefers Dynamic sponsored (gasless) txs so the agent wallet does not need
 * Base Sepolia ETH. Falls back to a self-funded send only when sponsorship is
 * clearly unavailable — that path still needs faucet ETH for gas.
 */
export async function payWorkerUsdc({
  to,
  amountCents,
}: PayWorkerInput): Promise<PayWorkerResult> {
  if (!isAddress(to)) {
    throw new Error(`Invalid worker address: ${to}`);
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
      throw new Error(
        `Agent wallet has no Base Sepolia ETH for gas, and sponsorship was unavailable. Enable EVM Gas Sponsorship in the Dynamic dashboard or fund ${walletMetadata.accountAddress} with faucet ETH. Original: ${message}`
      );
    }
    throw error;
  }
}
