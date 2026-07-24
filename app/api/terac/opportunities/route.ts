import { NextResponse } from "next/server";
import { z } from "zod";
import {
  createDraftOpportunity,
  getTeracProjectId,
  isTeracConfigured,
  listOpportunities,
} from "@/libs/terac";

function teracNotConfigured() {
  return NextResponse.json(
    { error: "Terac is not configured. Set TERAC_API_KEY." },
    { status: 503 }
  );
}

function teracError(error: unknown) {
  const message = error instanceof Error ? error.message : "Terac request failed";
  return NextResponse.json({ error: message }, { status: 502 });
}

export async function GET(request: Request) {
  if (!isTeracConfigured()) return teracNotConfigured();

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
    return teracError(error);
  }
}

const createBodySchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(5000).optional(),
  projectId: z.string().min(1).optional(),
  numParticipants: z.number().int().min(1).max(999).default(1),
  businessType: z.enum(["b2c", "b2b"]).default("b2c"),
  internalTitle: z.string().max(200).optional(),
});

export async function POST(request: Request) {
  if (!isTeracConfigured()) return teracNotConfigured();

  const json = await request.json().catch(() => null);
  const parsed = createBodySchema.safeParse(json);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid body", issues: parsed.error.issues },
      { status: 400 }
    );
  }

  const projectId = parsed.data.projectId ?? getTeracProjectId();
  if (!projectId) {
    return NextResponse.json(
      { error: "Missing projectId. Pass it in the body or set TERAC_PROJECT_ID." },
      { status: 400 }
    );
  }

  try {
    const opportunity = await createDraftOpportunity({
      ...parsed.data,
      projectId,
    });
    return NextResponse.json({ ok: true, opportunity });
  } catch (error) {
    return teracError(error);
  }
}
