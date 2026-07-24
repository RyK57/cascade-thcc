import { NextResponse } from "next/server";
import { isAddress } from "viem";
import { getBalancesForAddresses } from "@/libs/chain";
import {
  getAgentWalletAddress,
  isAgentWalletConfigured,
} from "@/libs/dynamic/agent-wallet";

/**
 * Agent + worker (+ optional `?extra=<requester>`) addresses and live Base
 * Sepolia balances in one batched call — Mission Control's poll target.
 */
export async function GET(request: Request) {
  const agentAddress = getAgentWalletAddress();
  const workerAddress = process.env.WORKER_WALLET_ADDRESS?.trim() || undefined;

  const url = new URL(request.url);
  const extra = url.searchParams.get("extra")?.trim() || undefined;
  if (extra && !isAddress(extra)) {
    return NextResponse.json({ error: "Invalid extra address" }, { status: 400 });
  }

  const addresses = [agentAddress, workerAddress, extra].filter(
    (a): a is string => Boolean(a)
  );

  let balances: Record<string, { eth: string; usdc: string }> = {};
  try {
    balances = await getBalancesForAddresses(addresses);
  } catch {
    // RPC hiccup — return addresses with empty balances rather than failing the poll.
  }

  return NextResponse.json({
    configured: isAgentWalletConfigured(),
    agentAddress,
    workerAddress,
    balances,
  });
}
