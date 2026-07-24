import { NextResponse } from "next/server";
import { BRAND } from "@/lib/constants/branding";
import {
  isDynamicConfigured,
  isDynamicSandboxConfigured,
  isServerWalletConfigured,
} from "@/libs/dynamic";
import { isLinqConfigured } from "@/libs/linq";
import { isTeracConfigured } from "@/libs/terac";
import { isSupabaseConfigured } from "@/utils/supabase/config";

export async function GET() {
  return NextResponse.json({
    ok: true,
    service: BRAND.name.toLowerCase(),
    product: BRAND.name,
    tiers: ["ai", "peer", "expert"],
    payments: "sandbox",
    supabase: isSupabaseConfigured() ? "configured" : "skipped",
    integrations: {
      linq: isLinqConfigured() ? "configured" : "missing",
      terac: isTeracConfigured() ? "configured" : "missing",
      dynamic: isDynamicConfigured() ? "configured" : "missing",
      dynamicSandbox: isDynamicSandboxConfigured() ? "configured" : "missing",
      serverWallet: isServerWalletConfigured() ? "configured" : "simulated",
    },
    timestamp: new Date().toISOString(),
  });
}
