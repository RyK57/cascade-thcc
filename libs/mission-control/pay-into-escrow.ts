"use client";

import { encodeFunctionData } from "viem";
import { getActiveNetworkId, switchActiveNetwork } from "@dynamic-labs-sdk/client";
import type { EvmWalletAccount } from "@dynamic-labs-sdk/evm";
import { createWalletClientForWalletAccount } from "@dynamic-labs-sdk/evm/viem";
import {
  ERC20_TRANSFER_ABI,
  USDC_BASE_SEPOLIA,
  usdcUnitsFromCents,
} from "@/libs/dynamic/usdc";

const BASE_SEPOLIA_NETWORK_ID = "84532";

export interface PayIntoEscrowInput {
  walletAccount: EvmWalletAccount;
  /** The agent's escrow wallet address. */
  agentAddress: `0x${string}`;
  amountCents: number;
}

/**
 * Requester → agent escrow: on-chain USDC transfer from the user's embedded
 * WaaS wallet on Base Sepolia. Runs entirely client-side via the Dynamic SDK.
 */
export async function payIntoEscrow({
  walletAccount,
  agentAddress,
  amountCents,
}: PayIntoEscrowInput): Promise<{ txHash: string }> {
  try {
    const active = await getActiveNetworkId({ walletAccount });
    if (active.networkId !== BASE_SEPOLIA_NETWORK_ID) {
      await switchActiveNetwork({
        walletAccount,
        networkId: BASE_SEPOLIA_NETWORK_ID,
      });
    }
  } catch (error) {
    throw new Error(
      "Could not switch to Base Sepolia — enable it in the Dynamic dashboard (Chains & Networks → testnets). " +
        (error instanceof Error ? error.message : "")
    );
  }

  const walletClient = await createWalletClientForWalletAccount({ walletAccount });

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
