import { NextResponse } from "next/server";
import { startAccountSession, verifyLinkToken } from "@/libs/account";
import { ROUTES } from "@/lib/constants/routes";
import { isSupabaseAdminConfigured } from "@/utils/supabase/admin";

export const runtime = "nodejs";

interface RouteContext {
  params: Promise<{ token: string }>;
}

/**
 * Magic-link landing. Burns the one-time token, mints a phone-verified web
 * session, then forwards to whatever the link was for — a job's checkout for
 * pay links, the account home otherwise.
 *
 * A dead or reused token is not an error page: send the person to phone
 * sign-in so they can get a fresh code without leaving the flow.
 */
export async function GET(request: Request, context: RouteContext) {
  const { token } = await context.params;
  const origin = new URL(request.url).origin;

  if (!isSupabaseAdminConfigured()) {
    return NextResponse.redirect(new URL(ROUTES.main, origin));
  }

  const challenge = await verifyLinkToken(token).catch((error) => {
    console.warn("[cascade] link verify failed", error);
    return null;
  });

  if (!challenge) {
    const retry = new URL(ROUTES.auth.phone, origin);
    retry.searchParams.set("expired", "1");
    return NextResponse.redirect(retry);
  }

  await startAccountSession({
    userId: challenge.userId,
    phone: challenge.phone,
  });

  const destination = new URL(ROUTES.main, origin);
  if (challenge.jobId) destination.searchParams.set("job", challenge.jobId);
  return NextResponse.redirect(destination);
}
