import { NextResponse } from "next/server";
import { z } from "zod";
import { requireOperator } from "@/libs/auth";
import { seedDemoJob } from "@/libs/seed";
import { isSupabaseAdminConfigured } from "@/utils/supabase/admin";

const bodySchema = z
  .object({
    title: z.string().min(1).optional(),
    amountCents: z.number().int().positive().max(10_000).optional(),
  })
  .default({});

/** Internal tooling: seed a checkout-ready demo job (no Linq/Terac needed). */
export async function POST(request: Request) {
  const denied = await requireOperator(request);
  if (denied) return denied;

  if (!isSupabaseAdminConfigured()) {
    return NextResponse.json(
      { error: "Supabase admin is not configured. Set SUPABASE_SERVICE_ROLE_KEY." },
      { status: 503 }
    );
  }

  const json = await request.json().catch(() => ({}));
  const parsed = bodySchema.safeParse(json ?? {});
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid body", issues: parsed.error.issues },
      { status: 400 }
    );
  }

  try {
    const result = await seedDemoJob(parsed.data);
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Seed failed";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
