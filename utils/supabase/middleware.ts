import { createServerClient } from "@supabase/ssr";
import type { SupabaseClient, User } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";
import {
  PROTECTED_ROUTE_PREFIXES,
  ROUTES,
} from "../../lib/constants/routes";
import { getSupabasePublicConfig } from "./config";

function isProtectedPath(pathname: string): boolean {
  return PROTECTED_ROUTE_PREFIXES.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`),
  );
}

/** Edge typecheck on Vercel can miss getUser on SupabaseAuthClient — call via typed surface. */
async function getRequestUser(client: SupabaseClient): Promise<User | null> {
  const auth = client.auth as SupabaseClient["auth"] & {
    getUser: () => Promise<{ data: { user: User | null } }>;
  };
  const { data } = await auth.getUser();
  return data.user;
}

export async function updateSession(request: NextRequest) {
  const config = getSupabasePublicConfig();
  if (!config) {
    return NextResponse.next({ request });
  }

  let supabaseResponse = NextResponse.next({ request });

  const supabase: SupabaseClient = createServerClient(config.url, config.anonKey, {
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

  const user = await getRequestUser(supabase);
  const { pathname } = request.nextUrl;

  if (!user && isProtectedPath(pathname)) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = ROUTES.auth.login;
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return supabaseResponse;
}
