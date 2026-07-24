import { NextResponse } from "next/server";
import { z } from "zod";
import { REQUEST_CODE_ERROR, requestAccountCode } from "@/libs/account";
import { isSupabaseAdminConfigured } from "@/utils/supabase/admin";

export const runtime = "nodejs";

const bodySchema = z.object({ phone: z.string().min(6).max(40) });

/**
 * Text a sign-in code to a number already in a thread with Cascade.
 *
 * Unknown numbers get the same 200 as known ones. Anything else turns this
 * endpoint into a "does this person use Cascade?" oracle, and the caller has
 * nothing useful to do with the difference anyway.
 */
export async function POST(request: Request) {
  if (!isSupabaseAdminConfigured()) {
    return NextResponse.json(
      { error: "Accounts are not configured." },
      { status: 503 }
    );
  }

  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Enter a phone number" }, { status: 400 });
  }

  try {
    const result = await requestAccountCode(parsed.data.phone);
    if (!result.ok && result.error === REQUEST_CODE_ERROR.unavailable) {
      return NextResponse.json(
        { error: "Sign-in is unavailable right now." },
        { status: 503 }
      );
    }
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Send failed";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
