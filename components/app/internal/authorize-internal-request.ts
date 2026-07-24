import { isInternalOperator } from "@/libs/auth";
import { createClient } from "@/utils/supabase/server";

/**
 * Gate `/api/internal/*` so customers never hit seed/metrics tooling.
 *
 * Allow when:
 * 1. `Authorization: Bearer $CRON_SECRET` matches (automation / scripts), or
 * 2. the signed-in user is on the operator allowlist (same as `/internal`).
 *
 * Deny otherwise — including production with no allowlist and no secret.
 */
export async function authorizeInternalRequest(
  request: Request
): Promise<boolean> {
  const secret = process.env.CRON_SECRET?.trim();
  if (secret) {
    const auth = request.headers.get("authorization");
    if (auth === `Bearer ${secret}`) return true;
  }

  const supabase = await createClient();
  if (!supabase) return false;

  const { data } = await supabase.auth.getUser();
  return isInternalOperator(data.user?.email);
}
