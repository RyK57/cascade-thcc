import {
  consumeAccountLink,
  consumeAccountLinkById,
  findLiveAccountLinkByPhone,
  recordCodeAttempt,
} from "@/db/accounts";
import { markPhoneVerified, upsertUserByPhone } from "@/db/users";
import type { AccountLink } from "@/utils/schema/account";
import { hashCode, hashesMatch, hashToken, normalizePhone } from "./tokens";

export interface VerifiedChallenge {
  phone: string;
  userId: string;
  jobId?: string;
}

/**
 * Resolve the account row for a phone that just proved ownership, creating it
 * if needed, and stamp the verification. Redeeming a challenge is the only
 * thing in the system that sets `phone_verified_at`.
 */
async function resolveUserId(link: AccountLink): Promise<string> {
  const userId =
    link.userId ?? (await upsertUserByPhone({ phone: link.phone })).id;

  await markPhoneVerified(userId).catch((error) => {
    console.warn("[cascade] marking phone verified failed", error);
  });

  return userId;
}

/** Tapped magic link: single-use, and the token itself is the proof. */
export async function verifyLinkToken(
  token: string
): Promise<VerifiedChallenge | null> {
  const raw = token.trim();
  if (!raw) return null;

  const link = await consumeAccountLink(hashToken(raw));
  if (!link) return null;

  return {
    phone: link.phone,
    userId: await resolveUserId(link),
    jobId: link.jobId,
  };
}

export const VERIFY_CODE_ERROR = {
  noChallenge: "no_challenge",
  wrongCode: "wrong_code",
} as const;

export type VerifyCodeError =
  (typeof VERIFY_CODE_ERROR)[keyof typeof VERIFY_CODE_ERROR];

export type VerifyCodeResult =
  | { ok: true; challenge: VerifiedChallenge }
  | { ok: false; error: VerifyCodeError };

/**
 * Typed 6-digit code. A wrong guess burns an attempt rather than the challenge,
 * so a fat-fingered digit does not force a new text; five wrong guesses retire
 * the challenge via the `attempts` filter in the lookup.
 */
export async function verifyPhoneCode(params: {
  phone: string;
  code: string;
}): Promise<VerifyCodeResult> {
  const phone = normalizePhone(params.phone);
  const found = await findLiveAccountLinkByPhone(phone);
  if (!found?.codeHash) {
    return { ok: false, error: VERIFY_CODE_ERROR.noChallenge };
  }

  if (!hashesMatch(found.codeHash, hashCode(phone, params.code))) {
    await recordCodeAttempt(found.link.id).catch(() => undefined);
    return { ok: false, error: VERIFY_CODE_ERROR.wrongCode };
  }

  const consumed = await consumeAccountLinkById(found.link.id);
  if (!consumed) {
    return { ok: false, error: VERIFY_CODE_ERROR.noChallenge };
  }

  return {
    ok: true,
    challenge: {
      phone,
      userId: await resolveUserId(found.link),
      jobId: found.link.jobId,
    },
  };
}
