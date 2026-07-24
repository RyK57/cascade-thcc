import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { isInternalOperator } from "./internal-access";

/**
 * Gate for operator-only API routes.
 *
 * Route handlers do not run through layouts, so the `/internal` layout check
 * covers nothing under `/api`. Anything that mutates state or spends budget on
 * the operator's behalf has to call this directly.
 *
 * Accepts either a `Bearer CRON_SECRET` header (for scheduled/machine callers)
 * or a signed-in operator session. Returns a response to send when the caller
 * is not authorized, or `null` when it may proceed.
 */
export async function requireOperator(
  request: Request
): Promise<NextResponse | null> {
  const secret = process.env.CRON_SECRET?.trim();
  if (secret && request.headers.get("authorization") === `Bearer ${secret}`) {
    return null;
  }

  const supabase = await createClient();
  const email = supabase
    ? (await supabase.auth.getUser()).data.user?.email
    : null;

  if (isInternalOperator(email)) return null;

  // 404 rather than 403, matching the `/internal` layout: a 403 confirms the
  // route exists.
  return NextResponse.json({ error: "Not found" }, { status: 404 });
}
