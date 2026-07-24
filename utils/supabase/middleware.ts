import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { ACCOUNT_SESSION_COOKIE } from "../../libs/account/constants";
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
  // Must be a non-empty value: `.has()` is true for a bare `?job=`, and
  // /main renders the full operator workspace when the id is empty.
  const jobParam = request.nextUrl.searchParams.get("job")?.trim();
  const isPayLink = pathname === ROUTES.main && Boolean(jobParam);

  // A phone-verified session is a first-class login for the customer app. The
  // cookie is only a routing hint here — middleware runs on the edge and cannot
  // reach the database, so every page and route re-checks it server-side before
  // trusting an identity.
  const hasAccountCookie = Boolean(
    request.cookies.get(ACCOUNT_SESSION_COOKIE)?.value
  );
  const isCustomerPath =
    pathname === ROUTES.main || pathname.startsWith(`${ROUTES.main}/`);
  // Read the env directly rather than importing the admin helper: middleware
  // runs on the edge and pulling in the service-role client just to test a
  // string would drag the whole SDK into that bundle.
  const accountsAvailable = Boolean(
    process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()
  );

  if (
    !user &&
    isProtectedPath(pathname) &&
    !isPayLink &&
    !(hasAccountCookie && isCustomerPath)
  ) {
    const loginUrl = request.nextUrl.clone();
    // Customers sign in with the phone they text from; operators keep the
    // email/password door. Sending a requester to a password form they never
    // created is the fastest way to lose them — but phone sign-in needs the
    // accounts backend, so without it fall back rather than route to a form
    // that cannot send a code.
    loginUrl.pathname =
      isCustomerPath && accountsAvailable
        ? ROUTES.auth.phone
        : ROUTES.auth.login;
    loginUrl.search = "";
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return supabaseResponse;
}
