import { createAdminClient } from "@/utils/supabase/admin";
import type { AccountLink, AccountLinkPurpose } from "@/utils/schema/account";
import {
  ACCOUNT_LINK_ROW_COLUMNS,
  mapAccountLinkRow,
  type AccountLinkRow,
} from "./map-row";

export interface CreateAccountLinkInput {
  phone: string;
  userId?: string;
  jobId?: string;
  purpose: AccountLinkPurpose;
  tokenHash: string;
  codeHash?: string;
  expiresAt: Date;
}

export async function createAccountLink(
  input: CreateAccountLinkInput
): Promise<AccountLink> {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("account_links")
    .insert({
      phone: input.phone,
      user_id: input.userId ?? null,
      job_id: input.jobId ?? null,
      purpose: input.purpose,
      token_hash: input.tokenHash,
      code_hash: input.codeHash ?? null,
      expires_at: input.expiresAt.toISOString(),
    })
    .select(ACCOUNT_LINK_ROW_COLUMNS)
    .single<AccountLinkRow>();

  if (error || !data) {
    throw new Error(error?.message ?? "Failed to create account link");
  }

  return mapAccountLinkRow(data);
}
