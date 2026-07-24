import { NextResponse } from "next/server";
import { isDynamicConfigured } from "@/libs/dynamic";
import { isLinqConfigured } from "@/libs/linq";
import { isTeracConfigured } from "@/libs/terac";
import { isSupabaseConfigured } from "@/utils/supabase/config";

export async function GET() {
  return NextResponse.json({
    ok: true,
    service: "yc-hackathon",
    supabase: isSupabaseConfigured() ? "configured" : "skipped",
    integrations: {
      linq: isLinqConfigured() ? "configured" : "missing",
      terac: isTeracConfigured() ? "configured" : "missing",
      dynamic: isDynamicConfigured() ? "configured" : "missing",
    },
    timestamp: new Date().toISOString(),
  });
}
