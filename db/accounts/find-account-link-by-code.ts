import { createAdminClient } from "@/utils/supabase/admin";
import type { AccountLink } from "@/utils/schema/account";
import {
  ACCOUNT_LINK_ROW_COLUMNS,
  mapAccountLinkRow,
  type AccountLinkRow,
} from "./map-row";

/** Max wrong codes before a challenge is dead. Keeps 6 digits guess-proof. */
export const MAX_CODE_ATTEMPTS = 5;

interface CodeLookupRow extends AccountLinkRow {
  code_hash: string | null;
}

/**
 * Newest live challenge for a phone, with its hashed code so the caller can
 * compare in constant time. Returns the raw hash rather than doing the compare
 * here so the DB layer stays free of crypto.
 */
export async function findLiveAccountLinkByPhone(
  phone: string
): Promise<{ link: AccountLink; codeHash: string | null } | null> {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("account_links")
    .select(`${ACCOUNT_LINK_ROW_COLUMNS}, code_hash`)
    .eq("phone", phone)
    .is("consumed_at", null)
    .gt("expires_at", new Date().toISOString())
    .lt("attempts", MAX_CODE_ATTEMPTS)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle<CodeLookupRow>();

  if (error) throw new Error(error.message);
  if (!data) return null;

  return { link: mapAccountLinkRow(data), codeHash: data.code_hash };
}

export async function recordCodeAttempt(linkId: string): Promise<void> {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("account_links")
    .select("attempts")
    .eq("id", linkId)
    .maybeSingle<{ attempts: number }>();

  await supabase
    .from("account_links")
    .update({ attempts: (data?.attempts ?? 0) + 1 })
    .eq("id", linkId);
}

export async function consumeAccountLinkById(
  linkId: string
): Promise<boolean> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("account_links")
    .update({ consumed_at: new Date().toISOString() })
    .eq("id", linkId)
    .is("consumed_at", null)
    .select("id")
    .maybeSingle<{ id: string }>();

  if (error) throw new Error(error.message);
  return Boolean(data);
}
