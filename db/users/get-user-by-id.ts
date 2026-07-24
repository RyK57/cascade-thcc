import { createAdminClient } from "@/utils/supabase/admin";
import type { User } from "@/utils/schema/user";
import { mapUserRow, USER_ROW_COLUMNS, type UserRow } from "./map-row";

export async function getUserByIdAdmin(id: string): Promise<User | null> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("users")
    .select(USER_ROW_COLUMNS)
    .eq("id", id)
    .maybeSingle<UserRow>();

  if (error) throw new Error(error.message);
  if (!data) return null;
  return mapUserRow(data);
}
