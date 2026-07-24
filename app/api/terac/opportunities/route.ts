import { NextResponse } from "next/server";
import { isTeracConfigured, listOpportunities } from "@/libs/terac";

export async function GET(request: Request) {
  if (!isTeracConfigured()) {
    return NextResponse.json(
      { error: "Terac is not configured. Set TERAC_API_KEY." },
      { status: 503 }
    );
  }

  const { searchParams } = new URL(request.url);
  const limit = searchParams.get("limit");
  const cursor = searchParams.get("cursor") ?? undefined;
  const status = searchParams.get("status") ?? undefined;
  const projectId = searchParams.get("projectId") ?? undefined;

  try {
    const result = await listOpportunities({
      limit: limit ? Number(limit) : 25,
      cursor,
      status,
      projectId,
    });
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Terac request failed";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
