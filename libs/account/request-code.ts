import { getLatestJobByHandle } from "@/db/jobs";
import {
  getLinqFromNumber,
  isLinqConfigured,
  sendChatMessage,
  sendTextMessage,
} from "@/libs/linq";
import { ACCOUNT_LINK_PURPOSE } from "@/utils/schema/account";
import { issueAccountLink } from "./issue-link";
import { normalizePhone } from "./tokens";

export const REQUEST_CODE_ERROR = {
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
 * Text a sign-in code to the number the person typed on the website.
 *
 * A number already in a thread gets the code as a reply there, so sign-in
 * stays part of the same conversation. A new number gets its first code in a
 * fresh chat: the person asked for that text seconds ago on the site, which
 * is solicited — not the cold outbound the channel forbids — and issuing the
 * challenge creates their account row. Every send is metered by the shared
 * daily cap, so this cannot become a spray endpoint.
 */
export async function requestAccountCode(
  rawPhone: string
): Promise<RequestCodeResult> {
  const phone = normalizePhone(rawPhone);

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

  const text = accountCodeMessage(issued.code, issued.url);
  try {
    const job = await getLatestJobByHandle(phone).catch(() => null);
    if (job) {
      await sendChatMessage({ chatId: job.linqChatId, text });
      return { ok: true, phone, delivered: true };
    }

    const from = getLinqFromNumber();
    if (!from) {
      console.warn(
        "[cascade] can't text a first sign-in code: set LINQ_FROM_NUMBER"
      );
      return { ok: true, phone, delivered: false };
    }
    await sendTextMessage({ from, to: [phone], text });
    return { ok: true, phone, delivered: true };
  } catch (error) {
    console.warn("[cascade] account code send failed", error);
    return { ok: true, phone, delivered: false };
  }
}
