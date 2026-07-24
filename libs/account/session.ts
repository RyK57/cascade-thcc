import { cookies } from "next/headers";
import {
  createAccountSession,
  getAccountSessionByTokenHash,
  revokeAccountSession,
} from "@/db/accounts";
import { getUserByPhone } from "@/db/users";
import type { AccountSession } from "@/utils/schema/account";
import type { User } from "@/utils/schema/user";
import { isSupabaseAdminConfigured } from "@/utils/supabase/admin";
import { ACCOUNT_SESSION_COOKIE, sessionExpiry } from "./constants";
import { generateLinkToken, hashToken, normalizePhone } from "./tokens";

export interface AccountIdentity {
  session: AccountSession;
  user: User | null;
}

/**
 * Mint a web session for a phone that just proved ownership (magic link or
 * code) and set the cookie. httpOnly so no client script — including the
 * Dynamic SDK — can read the session token.
 */
export async function startAccountSession(params: {
  userId: string;
  phone: string;
}): Promise<AccountSession> {
  const phone = normalizePhone(params.phone);
  const token = generateLinkToken();
  const expiresAt = sessionExpiry();

  const session = await createAccountSession({
    userId: params.userId,
    phone,
    tokenHash: hashToken(token),
    expiresAt,
  });

  const store = await cookies();
  store.set(ACCOUNT_SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: expiresAt,
  });

  return session;
}

/** The phone-verified caller, or null. Safe to call when Supabase is absent. */
export async function getAccountSession(): Promise<AccountSession | null> {
  if (!isSupabaseAdminConfigured()) return null;

  const store = await cookies();
  const token = store.get(ACCOUNT_SESSION_COOKIE)?.value;
  if (!token) return null;

  return getAccountSessionByTokenHash(hashToken(token)).catch(() => null);
}

export async function getAccountIdentity(): Promise<AccountIdentity | null> {
  const session = await getAccountSession();
  if (!session) return null;

  const user = await getUserByPhone(session.phone).catch(() => null);
  return { session, user };
}

export async function endAccountSession(): Promise<void> {
  const store = await cookies();
  const token = store.get(ACCOUNT_SESSION_COOKIE)?.value;
  if (token && isSupabaseAdminConfigured()) {
    await revokeAccountSession(hashToken(token)).catch(() => undefined);
  }
  store.delete(ACCOUNT_SESSION_COOKIE);
}
