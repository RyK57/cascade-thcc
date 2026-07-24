import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import {
  PROTECTED_ROUTE_PREFIXES,
  ROUTES,
} from "../../lib/constants/routes";
import { getSupabasePublicConfig } from "./config";

interface AuthUser {
  id: string;
}

interface AuthGetUserResult {
  data: { user: AuthUser | null };
}

interface AuthClientWithGetUser {
  getUser: () => Promise<AuthGetUserResult>;
}

function isProtectedPath(pathname: string): boolean {
  return PROTECTED_ROUTE_PREFIXES.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`),
  );
}

export async function updateSession(request: NextRequest) {
  const config = getSupabasePublicConfig();
  if (!config) {
    return NextResponse.next({ request });
  }

  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(config.url, config.anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        supabaseResponse = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => {
          supabaseResponse.cookies.set(name, value, options);
        });
      },
    },
  });

  // Local AuthClientWithGetUser avoids Vercel Edge typecheck gaps on SupabaseAuthClient.
  const auth = supabase.auth as AuthClientWithGetUser;
  const {
    data: { user },
  } = await auth.getUser();

  const { pathname } = request.nextUrl;

  // The pay link texted to requesters (/main?job=<id>) must open from any
  // phone without a Supabase account — Dynamic handles auth on that page.
  const isPayLink =
    pathname === ROUTES.main && request.nextUrl.searchParams.has("job");

  if (!user && isProtectedPath(pathname) && !isPayLink) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = ROUTES.auth.login;
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return supabaseResponse;
}
