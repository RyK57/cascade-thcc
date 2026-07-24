import { createAdminClient } from "@/utils/supabase/admin";
import type { CreateUserInput, User } from "@/utils/schema/user";
import { createUserSchema, USER_ROLE } from "@/utils/schema/user";
import { mapUserRow, USER_ROW_COLUMNS, type UserRow } from "./map-row";

/**
 * Placeholder email for a handle that has none. `users.email` is NOT NULL
 * UNIQUE, so this must be unique per handle: stripping to digits collapses
 * every email-style handle (iMessage regularly delivers Apple IDs, not phone
 * numbers) to the same empty string and the insert then fails the constraint.
 */
function placeholderEmail(handle: string): string {
  const slug = handle
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return `${slug || "handle"}@cascade.local`;
}

export async function upsertUserByPhone(
  input: CreateUserInput & { phone: string }
): Promise<User> {
  const parsed = createUserSchema.parse(input);
  const phone = input.phone.trim();
  const supabase = createAdminClient();

  const { data: existing } = await supabase
    .from("users")
    .select(USER_ROW_COLUMNS)
    .eq("phone", phone)
    .maybeSingle<UserRow>();

  if (existing) {
    const { data, error } = await supabase
      .from("users")
      .update({
        email: parsed.email ?? existing.email,
        full_name: parsed.fullName ?? existing.full_name,
        role: parsed.role ?? existing.role,
        credit_balance: parsed.creditBalance ?? existing.credit_balance,
        wallet_address: parsed.walletAddress ?? existing.wallet_address,
        trust_score: parsed.trustScore ?? existing.trust_score,
        last_lat: parsed.lastLat ?? existing.last_lat,
        last_lng: parsed.lastLng ?? existing.last_lng,
      })
      .eq("id", existing.id)
      .select(USER_ROW_COLUMNS)
      .single<UserRow>();

    if (error || !data) {
      throw new Error(error?.message ?? "Failed to update user");
    }
    return mapUserRow(data);
  }

  const { data, error } = await supabase
    .from("users")
    .insert({
      email: parsed.email ?? placeholderEmail(phone),
      full_name: parsed.fullName,
      phone,
      role: parsed.role ?? USER_ROLE.requester,
      credit_balance: parsed.creditBalance ?? 0,
      wallet_address: parsed.walletAddress,
      trust_score: parsed.trustScore ?? 50,
      last_lat: parsed.lastLat,
      last_lng: parsed.lastLng,
    })
    .select(USER_ROW_COLUMNS)
    .single<UserRow>();

  if (error || !data) {
    throw new Error(error?.message ?? "Failed to create user");
  }

  return mapUserRow(data);
}
