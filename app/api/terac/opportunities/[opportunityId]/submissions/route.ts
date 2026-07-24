import { NextResponse } from "next/server";
import { z } from "zod";
import { isTeracConfigured, listSubmissions } from "@/libs/terac";

/** Guards against `limit=abc` reaching Terac as `limit=NaN`. */
const querySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).optional(),
  cursor: z.string().min(1).optional(),
  status: z.string().min(1).optional(),
});

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
  const parsed = querySchema.safeParse({
    limit: searchParams.get("limit") ?? undefined,
    cursor: searchParams.get("cursor") ?? undefined,
    status: searchParams.get("status") ?? undefined,
  });

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid query", issues: parsed.error.issues },
      { status: 400 }
    );
  }

  try {
    const result = await listSubmissions({
      opportunityId,
      ...parsed.data,
    });
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Terac request failed";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
