import { NextResponse } from "next/server";
import { requireOperator } from "@/libs/auth";
import { isTeracConfigured, launchOpportunity } from "@/libs/terac";

/**
 * Launching spends budget — this endpoint is the explicit-confirm path for
 * the operator UI. The agent only calls launch after a YES in chat, and this
 * route establishes that the caller actually is the operator.
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ opportunityId: string }> }
) {
  const denied = await requireOperator(request);
  if (denied) return denied;

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
