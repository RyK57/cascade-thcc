import { NextResponse } from "next/server";
import { runAgentTurn } from "@/libs/agent";
import { isLinqConfigured, parseInboundMessage } from "@/libs/linq";
import { isSupabaseAdminConfigured } from "@/utils/supabase/admin";

/**
 * Inbound Linq webhook. Single live path: SDK parse → `runAgentTurn`
 * (persist job/message, Terac draft/launch/review, Dynamic payment state).
 * The LLM triage helpers in `libs/agent` are composed into that turn — not a
 * parallel webhook orchestrator.
 */
export async function POST(request: Request) {
  if (!isLinqConfigured()) {
    return NextResponse.json(
      { error: "Linq is not configured. Set LINQ_API_V3_API_KEY." },
      { status: 503 }
    );
  }
  if (!isSupabaseAdminConfigured()) {
    return NextResponse.json(
      { error: "Supabase admin is not configured. Set SUPABASE_SERVICE_ROLE_KEY." },
      { status: 503 }
    );
  }

  const body = await request.text();
  const headers = Object.fromEntries(request.headers.entries());

  let inbound;
  try {
    inbound = parseInboundMessage(body, headers);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Invalid webhook payload";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  if (!inbound) {
    return NextResponse.json({ ok: true, ignored: true });
  }

  try {
    const result = await runAgentTurn(inbound);
    return NextResponse.json({
      ok: true,
      action: result.action,
      jobId: result.jobId,
    });
  } catch (error) {
    // 200 so Linq doesn't retry: the inbound message is already recorded and a
    // retry would be deduped as a duplicate anyway.
    console.error("Agent turn failed:", error);
    return NextResponse.json({ ok: false });
  }
}
