import { createLedgerEntry } from "@/db/ledger";
import { adjustCredits } from "@/db/users";
import type { User } from "@/utils/schema/user";
import { createAdminClient } from "@/utils/supabase/admin";
import { SANDBOX_STARTING_CREDITS } from "./sandbox";

export const SANDBOX_STARTING_BALANCE_REASON = "sandbox_starting_balance";

/**
 * Sandbox stipend: every Cascade account can spend ~$100 of closed-loop
 * balance without faucet USDC. Credits map ~1:1 to USD (ceil(cents/100)).
 *
 * Idempotent — ledger reason is the once-only marker. Checking the ledger
 * before the balance prevents a free refill after someone spends down from a
 * DB-defaulted 100 that never wrote a grant row.
 */
export async function ensureSandboxStartingBalance(
  user: User
): Promise<User> {
  const alreadyGranted = await hasSandboxStartingGrant(user.id);
  if (alreadyGranted) return user;

  // Already at/above stipend (DB default or seed) — stamp the grant so a later
  // spend does not look like an ungive account and get topped up again.
  if (user.creditBalance >= SANDBOX_STARTING_CREDITS) {
    await createLedgerEntry({
      userId: user.id,
      deltaCredits: 0,
      reason: SANDBOX_STARTING_BALANCE_REASON,
    }).catch((error) => {
      console.warn("[dynamic] sandbox grant marker failed", error);
    });
    return user;
  }

  const delta = SANDBOX_STARTING_CREDITS - user.creditBalance;
  try {
    return await adjustCredits({
      userId: user.id,
      deltaCredits: delta,
      reason: SANDBOX_STARTING_BALANCE_REASON,
    });
  } catch (error) {
    console.warn("[dynamic] sandbox starting balance grant failed", error);
    return user;
  }
}

async function hasSandboxStartingGrant(userId: string): Promise<boolean> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("ledger")
    .select("id")
    .eq("user_id", userId)
    .eq("reason", SANDBOX_STARTING_BALANCE_REASON)
    .limit(1)
    .maybeSingle();

  if (error) {
    console.warn("[dynamic] sandbox grant ledger lookup failed", error);
    return false;
  }
  return Boolean(data);
}
