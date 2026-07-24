import { NextResponse } from "next/server";
import { z } from "zod";
import { authorizeInternalRequest } from "@/components/app/internal/authorize-internal-request";
import { seedDemoJob } from "@/libs/seed";
import { isSupabaseAdminConfigured } from "@/utils/supabase/admin";

const bodySchema = z
  .object({
    title: z.string().min(1).optional(),
    amountCents: z.number().int().positive().max(10_000).optional(),
  })
  .default({});

/** Internal tooling: seed a checkout-ready demo job (operators only). */
export async function POST(request: Request) {
  if (!(await authorizeInternalRequest(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!isSupabaseAdminConfigured()) {
    return NextResponse.json(
      { error: "Database admin is not configured." },
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
