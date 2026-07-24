import { createClient } from "@/utils/supabase/server";
import type { CreateUserInput, User } from "@/utils/schema/user";
import { createUserSchema, USER_ROLE } from "@/utils/schema/user";

export { adjustCredits } from "./adjust-credits";
export { getUserByIdAdmin } from "./get-user-by-id";
export { getUserByPhone } from "./get-user-by-phone";
export { listPeers } from "./list-peers";
export { markPhoneVerified } from "./mark-phone-verified";
export { upsertUserByPhone } from "./upsert-user-by-phone";

/** Cookie-session path used by auth prototypes. */
export async function getUserById(id: string): Promise<User | null> {
  const supabase = await createClient();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("users")
    .select(
      "id, email, full_name, phone, role, credit_balance, wallet_address, trust_score, created_at"
    )
    .eq("id", id)
    .maybeSingle();

  if (error || !data) return null;

  return {
    id: data.id,
    email: data.email ?? undefined,
    fullName: data.full_name ?? undefined,
    phone: data.phone ?? undefined,
    role: data.role ?? USER_ROLE.requester,
    creditBalance: data.credit_balance ?? 0,
    walletAddress: data.wallet_address ?? undefined,
    trustScore: data.trust_score ?? 50,
    createdAt: data.created_at,
  };
}

export async function createUser(input: CreateUserInput): Promise<User> {
  const parsed = createUserSchema.parse(input);
  const supabase = await createClient();

  if (!supabase) {
    throw new Error(
      "Supabase is not configured. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to .env.local"
    );
  }

  const { data, error } = await supabase
    .from("users")
    .insert({
      email: parsed.email,
      full_name: parsed.fullName,
      phone: parsed.phone,
      role: parsed.role ?? USER_ROLE.requester,
      credit_balance: parsed.creditBalance ?? 0,
      wallet_address: parsed.walletAddress,
      trust_score: parsed.trustScore ?? 50,
    })
    .select(
      "id, email, full_name, phone, role, credit_balance, wallet_address, trust_score, created_at"
    )
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "Failed to create user");
  }

  return {
    id: data.id,
    email: data.email ?? undefined,
    fullName: data.full_name ?? undefined,
    phone: data.phone ?? undefined,
    role: data.role ?? USER_ROLE.requester,
    creditBalance: data.credit_balance ?? 0,
    walletAddress: data.wallet_address ?? undefined,
    trustScore: data.trust_score ?? 50,
    createdAt: data.created_at,
  };
}
