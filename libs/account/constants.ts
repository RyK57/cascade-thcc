/** Cookie that carries the phone-verified web session. */
export const ACCOUNT_SESSION_COOKIE = "cascade_account";

/** Magic links are one tap away in a thread anyone can read over a shoulder. */
export const LINK_TTL_MINUTES = 30;

/** Long enough that a requester is not re-verifying every checkout. */
export const SESSION_TTL_DAYS = 30;

export function linkExpiry(now = new Date()): Date {
  return new Date(now.getTime() + LINK_TTL_MINUTES * 60_000);
}

export function sessionExpiry(now = new Date()): Date {
  return new Date(now.getTime() + SESSION_TTL_DAYS * 24 * 60 * 60_000);
}
