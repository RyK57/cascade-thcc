import { createAdminClient } from "@/utils/supabase/admin";
import type { User } from "@/utils/schema/user";
import { mapUserRow, USER_ROW_COLUMNS, type UserRow } from "./map-row";

/**
 * Record that this phone proved ownership. Called only after a texted link or
 * code was redeemed — the column is the difference between "someone typed this
 * number" and "we reached this number and they answered".
 *
 * First verification wins: re-verifying later must not reset the original
 * timestamp, which is the account's age for anything that cares.
 */
export async function markPhoneVerified(userId: string): Promise<User | null> {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("users")
    .update({ phone_verified_at: new Date().toISOString() })
    .eq("id", userId)
    .is("phone_verified_at", null)
    .select(USER_ROW_COLUMNS)
    .maybeSingle<UserRow>();

  if (error) throw new Error(error.message);
  return data ? mapUserRow(data) : null;
}
