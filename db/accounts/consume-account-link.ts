import { createAdminClient } from "@/utils/supabase/admin";
import type { AccountLink } from "@/utils/schema/account";
import {
  ACCOUNT_LINK_ROW_COLUMNS,
  mapAccountLinkRow,
  type AccountLinkRow,
} from "./map-row";

/**
 * Burn a challenge by its hashed token. The `is` filter on `consumed_at` makes
 * this a compare-and-set: two taps on the same iMessage link race, and only the
 * update that finds the row still unconsumed comes back with a row.
 */
export async function consumeAccountLink(
  tokenHash: string
): Promise<AccountLink | null> {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("account_links")
    .update({ consumed_at: new Date().toISOString() })
    .eq("token_hash", tokenHash)
    .is("consumed_at", null)
    .gt("expires_at", new Date().toISOString())
    .select(ACCOUNT_LINK_ROW_COLUMNS)
    .maybeSingle<AccountLinkRow>();

  if (error) throw new Error(error.message);
  return data ? mapAccountLinkRow(data) : null;
}
