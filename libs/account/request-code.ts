import { getLatestJobByHandle } from "@/db/jobs";
import { isLinqConfigured, sendChatMessage } from "@/libs/linq";
import { ACCOUNT_LINK_PURPOSE } from "@/utils/schema/account";
import { issueAccountLink } from "./issue-link";
import { normalizePhone } from "./tokens";

export const REQUEST_CODE_ERROR = {
  unknownPhone: "unknown_phone",
  unavailable: "unavailable",
} as const;

export type RequestCodeError =
  (typeof REQUEST_CODE_ERROR)[keyof typeof REQUEST_CODE_ERROR];

export type RequestCodeResult =
  | { ok: true; phone: string; delivered: boolean }
  | { ok: false; error: RequestCodeError };

export function accountCodeMessage(code: string, url: string): string {
  return `Cascade sign-in code: ${code}\n\nOr tap to open your account: ${url}\n\nExpires in 30 minutes. Ignore this if you didn't ask.`;
}

/**
 * Send a sign-in code to a phone **that is already in a thread with Cascade**.
 * The inbound-first check is not just anti-abuse: texting a code to a number
 * that never messaged the line is cold outbound, which the channel forbids. It
 * also means an attacker cannot use this endpoint to spray messages.
 *
 * The reply goes to the existing chat rather than opening a new one, so sign-in
 * stays part of the same conversation.
 */
export async function requestAccountCode(
  rawPhone: string
): Promise<RequestCodeResult> {
  const phone = normalizePhone(rawPhone);

  const job = await getLatestJobByHandle(phone).catch(() => null);
  if (!job) return { ok: false, error: REQUEST_CODE_ERROR.unknownPhone };

  const issued = await issueAccountLink({
    phone,
    purpose: ACCOUNT_LINK_PURPOSE.link,
  });
  if (!issued) return { ok: false, error: REQUEST_CODE_ERROR.unavailable };

  if (!isLinqConfigured()) {
    // Codes are useless without a way to deliver them, but the challenge is
    // already stored — surface the state instead of pretending it was sent.
    return { ok: true, phone, delivered: false };
  }

  try {
    await sendChatMessage({
      chatId: job.linqChatId,
      text: accountCodeMessage(issued.code, issued.url),
    });
    return { ok: true, phone, delivered: true };
  } catch (error) {
    console.warn("[cascade] account code send failed", error);
    return { ok: true, phone, delivered: false };
  }
}
