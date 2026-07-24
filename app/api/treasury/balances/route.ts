import { NextResponse } from "next/server";
import { isAddress } from "viem";
import { getBalancesForAddresses } from "@/libs/chain";
import {
  getAgentWalletAddress,
  isAgentWalletConfigured,
} from "@/libs/dynamic/agent-wallet";
import { ensureSandboxTreasury } from "@/libs/dynamic/treasury";
import { isSupabaseAdminConfigured } from "@/utils/supabase/admin";

export const runtime = "nodejs";

/**
 * Agent/treasury (+ optional `?extra=<requester>`) live Base Sepolia balances.
 * Prefers the Cascade agent wallet address; falls back to sandbox treasury.
 * Simulated placeholders resolve to zero balances rather than erroring.
 */
export async function GET(request: Request) {
  if (!isSupabaseAdminConfigured()) {
    return NextResponse.json(
      { error: "Supabase admin is not configured. Set SUPABASE_SERVICE_ROLE_KEY." },
      { status: 503 }
    );
  }

  const url = new URL(request.url);
  const extra = url.searchParams.get("extra")?.trim() || undefined;
  if (extra && !isAddress(extra)) {
    return NextResponse.json({ error: "Invalid extra address" }, { status: 400 });
  }

  try {
    const agentAddress = getAgentWalletAddress();
    const treasury = await ensureSandboxTreasury();
    const escrowAddress = agentAddress ?? treasury.address;
    const addresses = [escrowAddress, extra].filter((a): a is string =>
      Boolean(a)
    );

    let balances: Record<string, { eth: string; usdc: string }> = {};
    try {
      balances = await getBalancesForAddresses(addresses);
    } catch {
      // RPC hiccup — keep the poll alive with empty balances.
    }

    return NextResponse.json({
      treasuryAddress: escrowAddress,
      agentWalletConfigured: isAgentWalletConfigured(),
      agentAddress: agentAddress ?? null,
      balances,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Treasury lookup failed";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
