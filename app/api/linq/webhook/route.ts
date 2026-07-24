import { NextResponse } from "next/server";
import { isLinqConfigured } from "@/libs/linq";
import { handleInbound } from "@/libs/agent";

/**
 * Inbound Linq webhook — the start of every agent turn.
 * Point `linq webhooks listen --forward-to <origin>/api/linq/webhook` here while building.
 *
 * TODO: verify `x-webhook-signature` against LINQ_WEBHOOK_SECRET on permanent
 * subscriptions before trusting the payload.
 */
export async function POST(request: Request) {
  if (!isLinqConfigured()) {
    return NextResponse.json(
      { error: "Linq is not configured. Set LINQ_API_V3_API_KEY." },
      { status: 503 }
    );
  }

  const raw = await request.json().catch(() => null);
  if (raw === null) {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  try {
    const result = await handleInbound(raw);
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Agent turn failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
