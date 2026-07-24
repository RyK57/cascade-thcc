import { NextResponse } from "next/server";
import { ROUTES } from "@/lib/constants/routes";
import { createClient } from "@/utils/supabase/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? ROUTES.main;
  const errorDescription = searchParams.get("error_description");

  if (errorDescription) {
    const errorUrl = new URL(ROUTES.auth.error, origin);
    errorUrl.searchParams.set("message", errorDescription);
    return NextResponse.redirect(errorUrl);
  }

  if (!code) {
    return NextResponse.redirect(`${origin}${ROUTES.auth.error}`);
  }

  const supabase = await createClient();
  if (!supabase) {
    return NextResponse.redirect(`${origin}${ROUTES.auth.error}`);
  }

  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) {
    const errorUrl = new URL(ROUTES.auth.error, origin);
    errorUrl.searchParams.set("message", error.message);
    return NextResponse.redirect(errorUrl);
  }

  const safeNext = next.startsWith("/") ? next : ROUTES.main;
  return NextResponse.redirect(`${origin}${safeNext}`);
}
