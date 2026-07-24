import { NextResponse } from "next/server";
import { BRAND } from "@/lib/constants/branding";
import {
  isDynamicConfigured,
  isDynamicSandboxConfigured,
  isServerWalletConfigured,
} from "@/libs/dynamic";
import { isAgentWalletConfigured } from "@/libs/dynamic/agent-wallet";
import { isLinqConfigured } from "@/libs/linq";
import { isTeracConfigured } from "@/libs/terac";
import { isSupabaseConfigured } from "@/utils/supabase/config";

export async function GET() {
  const phoneWallets =
    process.env.DYNAMIC_PREGEN_WALLETS?.trim() === "1"
      ? "pregen"
      : "derived";
  const agentWallet = isAgentWalletConfigured();
  const treasuryMode = agentWallet
    ? "agent-wallet"
    : isServerWalletConfigured()
      ? "server-wallet"
      : "simulated";

  return NextResponse.json({
    ok: true,
    service: BRAND.name.toLowerCase(),
    product: BRAND.name,
    tiers: ["ai", "peer", "expert"],
    payments: "sandbox",
    phoneWallets,
    treasuryMode,
    supabase: isSupabaseConfigured() ? "configured" : "skipped",
    integrations: {
      linq: isLinqConfigured() ? "configured" : "missing",
      terac: isTeracConfigured() ? "configured" : "missing",
      dynamic: isDynamicConfigured() ? "configured" : "missing",
      dynamicSandbox: isDynamicSandboxConfigured() ? "configured" : "missing",
      agentWallet: agentWallet ? "configured" : "missing",
      serverWallet: isServerWalletConfigured() ? "configured" : "simulated",
    },
    timestamp: new Date().toISOString(),
  });
}
