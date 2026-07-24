/**
 * Who may see internal tooling.
 *
 * `/internal` reveals which secrets are set, so it must not be reachable — or
 * advertised — by every signed-in customer. Until the schema carries a staff
 * role (`utils/schema/user` only models requester/peer/both, which is a product
 * role, not an authorization one), this is an operator allowlist:
 *
 *   INTERNAL_OPERATOR_EMAILS=ops@example.com,alex@example.com
 *
 * With no allowlist set the tooling stays available on local/preview builds and
 * is closed in production, so a deploy can never accidentally ship it wide open.
 *
 * Server-only: read from layouts and server components, never a client bundle.
 */
export function isInternalOperator(email: string | null | undefined): boolean {
  const allowlist = (process.env.INTERNAL_OPERATOR_EMAILS ?? "")
    .split(",")
    .map((entry) => entry.trim().toLowerCase())
    .filter(Boolean);

  if (allowlist.length > 0) {
    return Boolean(email && allowlist.includes(email.toLowerCase()));
  }

  return process.env.NODE_ENV !== "production";
}
