import { NextResponse } from "next/server";
import { isTeracConfigured, listSubmissions } from "@/libs/terac";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ opportunityId: string }> }
) {
  if (!isTeracConfigured()) {
    return NextResponse.json(
      { error: "Terac is not configured. Set TERAC_API_KEY." },
      { status: 503 }
    );
  }

  const { opportunityId } = await params;
  const { searchParams } = new URL(request.url);
  const limit = searchParams.get("limit");

  try {
    const result = await listSubmissions({
      opportunityId,
      limit: limit ? Number(limit) : undefined,
      cursor: searchParams.get("cursor") ?? undefined,
      status: searchParams.get("status") ?? undefined,
    });
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Terac request failed";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
