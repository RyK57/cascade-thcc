import { PROTECTED_ROUTE_PREFIXES, ROUTES } from "@/lib/constants/routes";

export function isProtectedPath(pathname: string): boolean {
  return PROTECTED_ROUTE_PREFIXES.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`),
  );
}

export function getAuthRedirectPath(pathname: string): string {
  const next = encodeURIComponent(pathname);
  return `${ROUTES.auth.login}?next=${next}`;
}
