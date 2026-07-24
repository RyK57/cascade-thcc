import { createAdminClient } from "@/utils/supabase/admin";
import type { User } from "@/utils/schema/user";
import { USER_ROLE } from "@/utils/schema/user";
import { mapUserRow, USER_ROW_COLUMNS, type UserRow } from "./map-row";

/** Peers ordered by trust_score descending for broadcast preference. */
export async function listPeers(): Promise<User[]> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("users")
    .select(USER_ROW_COLUMNS)
    .in("role", [USER_ROLE.peer, USER_ROLE.both])
    .order("trust_score", { ascending: false })
    .returns<UserRow[]>();

  if (error) throw new Error(error.message);
  return (data ?? []).map(mapUserRow);
}
