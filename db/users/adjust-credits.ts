import { createAdminClient } from "@/utils/supabase/admin";
import type { User } from "@/utils/schema/user";
import { mapUserRow, type UserRow } from "./map-row";
import { createLedgerEntry } from "@/db/ledger/create-ledger-entry";

/**
 * Adjust a user's credit balance atomically.
 *
 * The arithmetic and the overdraft guard both run inside
 * `adjust_user_credits` (migration 00007). Doing it as a read-modify-write in
 * application code lost updates: two concurrent debits read the same starting
 * balance and the second write clobbered the first, so a 10-credit user could
 * spend 16 and the ledger would permanently disagree with the balance.
 */
export async function adjustCredits(params: {
  userId: string;
  deltaCredits: number;
  jobId?: string;
  reason: string;
}): Promise<User> {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .rpc("adjust_user_credits", {
      p_user_id: params.userId,
      p_delta: params.deltaCredits,
    })
    .select("*")
    .single<UserRow>();

  if (error) {
    if (error.message.includes("insufficient_credits")) {
      throw new Error("Insufficient credits");
    }
    if (error.message.includes("user_not_found")) {
      throw new Error("User not found");
    }
    throw new Error(error.message);
  }
  if (!data) {
    throw new Error("Failed to adjust credits");
  }

  await createLedgerEntry({
    userId: params.userId,
    deltaCredits: params.deltaCredits,
    jobId: params.jobId,
    reason: params.reason,
  });

  return mapUserRow(data);
}
