import { NextResponse } from "next/server";
import { z } from "zod";
import { isTeracConfigured, reviewSubmission } from "@/libs/terac";

const bodySchema = z.object({
  decision: z.enum(["approve", "reject"]),
});

export async function POST(
  request: Request,
  { params }: { params: Promise<{ submissionId: string }> }
) {
  if (!isTeracConfigured()) {
    return NextResponse.json(
      { error: "Terac is not configured. Set TERAC_API_KEY." },
      { status: 503 }
    );
  }

  const json = await request.json().catch(() => null);
  const parsed = bodySchema.safeParse(json);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid body", issues: parsed.error.issues },
      { status: 400 }
    );
  }

  const { submissionId } = await params;

  try {
    const submission = await reviewSubmission({
      submissionId,
      decision: parsed.data.decision,
    });
    return NextResponse.json({ ok: true, submission });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Terac request failed";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
