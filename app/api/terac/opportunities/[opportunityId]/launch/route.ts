import { NextResponse } from "next/server";
import { isTeracConfigured, launchOpportunity } from "@/libs/terac";

/**
 * Launching spends budget — this endpoint is the explicit-confirm path for
 * the operator UI. The agent only calls launch after a YES in chat.
 */
export async function POST(
  _request: Request,
  { params }: { params: Promise<{ opportunityId: string }> }
) {
  if (!isTeracConfigured()) {
    return NextResponse.json(
      { error: "Terac is not configured. Set TERAC_API_KEY." },
      { status: 503 }
    );
  }

  const { opportunityId } = await params;

  try {
    const opportunity = await launchOpportunity(opportunityId);
    return NextResponse.json({ ok: true, opportunity });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Terac request failed";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
