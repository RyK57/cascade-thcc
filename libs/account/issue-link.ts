import { createAccountLink } from "@/db/accounts";
import { upsertUserByPhone } from "@/db/users";
import { ROUTES } from "@/lib/constants/routes";
import { getPublicSiteUrl } from "@/lib/constants/site";
import { ACCOUNT_LINK_PURPOSE, type AccountLinkPurpose } from "@/utils/schema/account";
import { isSupabaseAdminConfigured } from "@/utils/supabase/admin";
import { linkExpiry } from "./constants";
import {
  generateLinkToken,
  generateOtpCode,
  hashCode,
  hashToken,
  normalizePhone,
} from "./tokens";

export interface IssuedAccountLink {
  url: string;
  code: string;
  expiresAt: Date;
}

export function siteUrl(): string {
  return getPublicSiteUrl();
}

/**
 * Mint a one-time login for a phone. Returns both a tappable URL and a typed
 * code: the link is the happy path, the code is for "I'm on my laptop, not my
 * phone".
 *
 * The number does not need an existing thread — web sign-up types a fresh
 * number and the code text it requested is solicited, not cold outbound. The
 * upsert below is what creates that account row on first contact.
 */
export async function issueAccountLink(params: {
  phone: string;
  jobId?: string;
  purpose?: AccountLinkPurpose;
}): Promise<IssuedAccountLink | null> {
  if (!isSupabaseAdminConfigured()) return null;

  const phone = normalizePhone(params.phone);
  if (!phone || phone === "+") return null;

  const token = generateLinkToken();
  const code = generateOtpCode();
  const expiresAt = linkExpiry();

  // The account row must exist before the session can point at it. This is the
  // same upsert the agent already runs on first inbound, so it is a no-op for
  // anyone who has texted before.
  const user = await upsertUserByPhone({ phone }).catch(() => null);

  await createAccountLink({
    phone,
    userId: user?.id,
    jobId: params.jobId,
    purpose: params.purpose ?? ACCOUNT_LINK_PURPOSE.link,
    tokenHash: hashToken(token),
    codeHash: hashCode(phone, code),
    expiresAt,
  });

  return {
    url: `${siteUrl()}${ROUTES.accountLink(token)}`,
    code,
    expiresAt,
  };
}
