import { NextResponse } from "next/server";
import { isDynamicConfigured } from "@/libs/dynamic";
import { isLinqConfigured } from "@/libs/linq";
import { isTeracConfigured } from "@/libs/terac";

export async function GET() {
  return NextResponse.json({
    ok: true,
    integrations: {
      linq: isLinqConfigured() ? "configured" : "missing",
      terac: isTeracConfigured() ? "configured" : "missing",
      dynamic: isDynamicConfigured() ? "configured" : "missing",
    },
    timestamp: new Date().toISOString(),
  });
}
