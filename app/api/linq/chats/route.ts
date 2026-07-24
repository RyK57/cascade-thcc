import { NextResponse } from "next/server";
import { z } from "zod";
import { isLinqConfigured, sendTextMessage } from "@/libs/linq";

const bodySchema = z.object({
  from: z.string().min(1),
  to: z.array(z.string().min(1)).min(1),
  text: z.string().min(1),
});

export async function POST(request: Request) {
  if (!isLinqConfigured()) {
    return NextResponse.json(
      { error: "Linq is not configured. Set LINQ_API_V3_API_KEY." },
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

  try {
    const chat = await sendTextMessage(parsed.data);
    return NextResponse.json({ ok: true, chat });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Linq request failed";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
