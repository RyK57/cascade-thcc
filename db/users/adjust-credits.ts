import { createAdminClient } from "@/utils/supabase/admin";
import type { User } from "@/utils/schema/user";
import { mapUserRow, USER_ROW_COLUMNS, type UserRow } from "./map-row";
import { createLedgerEntry } from "@/db/ledger/create-ledger-entry";

export async function adjustCredits(params: {
  userId: string;
  deltaCredits: number;
  jobId?: string;
  reason: string;
}): Promise<User> {
  const supabase = createAdminClient();
  const { data: current, error: readError } = await supabase
    .from("users")
    .select(USER_ROW_COLUMNS)
    .eq("id", params.userId)
    .single<UserRow>();

  if (readError || !current) {
    throw new Error(readError?.message ?? "User not found");
  }

  const nextBalance = current.credit_balance + params.deltaCredits;
  if (nextBalance < 0) {
    throw new Error("Insufficient credits");
  }

  const { data, error } = await supabase
    .from("users")
    .update({ credit_balance: nextBalance })
    .eq("id", params.userId)
    .select(USER_ROW_COLUMNS)
    .single<UserRow>();

  if (error || !data) {
    throw new Error(error?.message ?? "Failed to adjust credits");
  }

  await createLedgerEntry({
    userId: params.userId,
    deltaCredits: params.deltaCredits,
    jobId: params.jobId,
    reason: params.reason,
  });

  return mapUserRow(data);
}
