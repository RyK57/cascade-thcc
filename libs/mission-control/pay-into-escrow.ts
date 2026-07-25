"use client";

import { encodeFunctionData } from "viem";
import type { EvmWalletAccount } from "@dynamic-labs-sdk/evm";
import { createWalletClientForWalletAccount } from "@dynamic-labs-sdk/evm/viem";
import { ensureBaseSepolia } from "@/libs/dynamic/ensure-base-sepolia";
import {
  ERC20_TRANSFER_ABI,
  USDC_BASE_SEPOLIA,
  usdcUnitsFromCents,
} from "@/libs/dynamic/usdc";

export interface PayIntoEscrowInput {
  walletAccount: EvmWalletAccount;
  /** The agent's escrow wallet address. */
  agentAddress: `0x${string}`;
  amountCents: number;
}

export interface PayIntoEscrowResult {
  txHash: string;
  simulated?: boolean;
}

/**
 * Requester → agent escrow: on-chain USDC transfer from the user's embedded
 * WaaS wallet on Base Sepolia. Runs entirely client-side via the Dynamic SDK.
 */
export async function payIntoEscrow({
  walletAccount,
  agentAddress,
  amountCents,
}: PayIntoEscrowInput): Promise<PayIntoEscrowResult> {
  await ensureBaseSepolia(walletAccount);

  const walletClient = await createWalletClientForWalletAccount({
    walletAccount,
  });

  const txHash = await walletClient.sendTransaction({
    to: USDC_BASE_SEPOLIA,
    data: encodeFunctionData({
      abi: ERC20_TRANSFER_ABI,
      functionName: "transfer",
      args: [agentAddress, usdcUnitsFromCents(amountCents)],
    }),
  });

  return { txHash };
}
