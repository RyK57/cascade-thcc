import { parseEther } from "viem";

export const DEFAULT_AGENT_GAS_TARGET_ETH = "0.001";

export function getAgentGasTargetWei(
  targetEth = process.env.AGENT_GAS_TARGET_ETH?.trim() ||
    DEFAULT_AGENT_GAS_TARGET_ETH
): bigint {
  const targetWei = parseEther(targetEth);
  if (targetWei <= 0n) {
    throw new Error("AGENT_GAS_TARGET_ETH must be greater than zero.");
  }
  return targetWei;
}

export function calculateAgentGasTopUpWei(
  balanceWei: bigint,
  targetWei: bigint
): bigint {
  if (balanceWei < 0n || targetWei <= 0n) {
    throw new Error("Gas balances and targets must be positive.");
  }
  return balanceWei >= targetWei ? 0n : targetWei - balanceWei;
}
