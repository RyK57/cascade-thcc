import { encodeFunctionData, isAddress } from "viem";
import { getAgentWalletClient } from "./agent-wallet";
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
 * Requires the agent wallet to hold Base Sepolia ETH (gas) + USDC.
 */
export async function payWorkerUsdc({
  to,
  amountCents,
}: PayWorkerInput): Promise<PayWorkerResult> {
  if (!isAddress(to)) {
    throw new Error(`Invalid worker address: ${to}`);
  }

  const wallet = await getAgentWalletClient();
  const txHash = await wallet.sendTransaction({
    to: USDC_BASE_SEPOLIA,
    data: encodeFunctionData({
      abi: ERC20_TRANSFER_ABI,
      functionName: "transfer",
      args: [to, usdcUnitsFromCents(amountCents)],
    }),
  });

  return { txHash, explorerUrl: explorerTxUrl(txHash) };
}
