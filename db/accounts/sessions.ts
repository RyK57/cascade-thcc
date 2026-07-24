import { createAdminClient } from "@/utils/supabase/admin";
import type { AccountSession } from "@/utils/schema/account";
import {
  ACCOUNT_SESSION_ROW_COLUMNS,
  mapAccountSessionRow,
  type AccountSessionRow,
} from "./map-row";

export async function createAccountSession(input: {
  userId: string;
  phone: string;
  tokenHash: string;
  expiresAt: Date;
}): Promise<AccountSession> {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("account_sessions")
    .insert({
      user_id: input.userId,
      phone: input.phone,
      token_hash: input.tokenHash,
      expires_at: input.expiresAt.toISOString(),
    })
    .select(ACCOUNT_SESSION_ROW_COLUMNS)
    .single<AccountSessionRow>();

  if (error || !data) {
    throw new Error(error?.message ?? "Failed to create account session");
  }

  return mapAccountSessionRow(data);
}

/** Live session for a cookie's hashed token, or null when expired/revoked. */
export async function getAccountSessionByTokenHash(
  tokenHash: string
): Promise<AccountSession | null> {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("account_sessions")
    .select(ACCOUNT_SESSION_ROW_COLUMNS)
    .eq("token_hash", tokenHash)
    .is("revoked_at", null)
    .gt("expires_at", new Date().toISOString())
    .maybeSingle<AccountSessionRow>();

  if (error) throw new Error(error.message);
  return data ? mapAccountSessionRow(data) : null;
}

export async function revokeAccountSession(tokenHash: string): Promise<void> {
  const supabase = createAdminClient();
  await supabase
    .from("account_sessions")
    .update({ revoked_at: new Date().toISOString() })
    .eq("token_hash", tokenHash);
}
