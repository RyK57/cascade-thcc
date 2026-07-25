import { NextResponse } from "next/server";
import { z } from "zod";
import { REQUEST_CODE_ERROR, requestAccountCode } from "@/libs/account";
import { isSupabaseAdminConfigured } from "@/utils/supabase/admin";

export const runtime = "nodejs";

const bodySchema = z.object({ phone: z.string().min(6).max(40) });

/**
 * Text a sign-in code to the number the person typed — a reply in their
 * existing Cascade thread, or a fresh chat for a brand-new number (which also
 * creates their account row). After the code is redeemed, the agent introduces
 * itself on the new thread.
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
