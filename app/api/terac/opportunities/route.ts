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

/**
 * `Number("abc")` is NaN and NaN is not undefined, so an unvalidated limit was
 * serialized into the upstream query as `limit=NaN`. Validate like the POST
 * handler below already does.
 */
const listQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(25),
  cursor: z.string().min(1).optional(),
  status: z.string().min(1).optional(),
  projectId: z.string().min(1).optional(),
});

export async function GET(request: Request) {
  if (!isTeracConfigured()) return teracNotConfigured();

  const { searchParams } = new URL(request.url);
  const parsed = listQuerySchema.safeParse({
    limit: searchParams.get("limit") ?? undefined,
    cursor: searchParams.get("cursor") ?? undefined,
    status: searchParams.get("status") ?? undefined,
    projectId: searchParams.get("projectId") ?? undefined,
  });

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid query", issues: parsed.error.issues },
      { status: 400 }
    );
  }

  try {
    const result = await listOpportunities(parsed.data);
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
