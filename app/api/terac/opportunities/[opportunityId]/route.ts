import { NextResponse } from "next/server";
import { getOpportunity, isTeracConfigured } from "@/libs/terac";

export async function GET(
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
    const opportunity = await getOpportunity(opportunityId);
    return NextResponse.json(opportunity);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Terac request failed";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
