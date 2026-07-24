import { getUserByPhone } from "@/db/users";
import { isSupabaseAdminConfigured } from "@/utils/supabase/admin";
import { normalizePhone } from "./tokens";

/**
 * Has this handle proved it owns its phone number?
 *
 * A number sitting in `users.phone` proves nothing — the agent writes it from
 * whatever handle Linq delivered. Only redeeming a texted link or code sets
 * `phone_verified_at`, and that is what gates work, quotes and money.
 *
 * When there is no database, there are no accounts to check and the agent
 * stays usable: a zero-config demo must not be locked out by a gate it has no
 * way to pass.
 */
export async function isPhoneVerified(handle: string): Promise<boolean> {
  if (!isSupabaseAdminConfigured()) return true;

  const user = await getUserByPhone(normalizePhone(handle)).catch((error) => {
    console.warn("[cascade] verification lookup failed", error);
    return null;
  });

  return Boolean(user?.phoneVerifiedAt);
}
