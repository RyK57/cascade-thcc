import { NextResponse } from "next/server";
import { z } from "zod";
import { startAccountSession, verifyPhoneCode } from "@/libs/account";
import { ROUTES } from "@/lib/constants/routes";
import { isSupabaseAdminConfigured } from "@/utils/supabase/admin";

export const runtime = "nodejs";

const bodySchema = z.object({
  phone: z.string().min(6).max(40),
  code: z.string().regex(/^\d{6}$/, "Enter the 6-digit code"),
});

/** Exchange a texted code for a phone-verified web session cookie. */
export async function POST(request: Request) {
  if (!isSupabaseAdminConfigured()) {
    return NextResponse.json(
      { error: "Accounts are not configured." },
      { status: 503 }
    );
  }

  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Enter the 6-digit code from your thread" },
      { status: 400 }
    );
  }

  try {
    const result = await verifyPhoneCode(parsed.data);
    if (!result.ok) {
      return NextResponse.json(
        { error: "That code is wrong or expired. Ask for a new one." },
        { status: 401 }
      );
    }

    await startAccountSession({
      userId: result.challenge.userId,
      phone: result.challenge.phone,
    });

    const next = result.challenge.jobId
      ? `${ROUTES.main}?job=${result.challenge.jobId}`
      : ROUTES.main;

    return NextResponse.json({ ok: true, next });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Verify failed";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
