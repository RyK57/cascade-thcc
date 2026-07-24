import { getPayUrl } from "@/libs/agent/pay-url";
import { ACCOUNT_LINK_PURPOSE } from "@/utils/schema/account";
import { issueAccountLink } from "./issue-link";

/**
 * The pay link texted into a thread. Prefer an account-bound one-time link:
 * tapping it signs the requester into their own account and lands on checkout,
 * so funding is an authenticated act instead of "whoever holds this URL".
 *
 * Falls back to the bare `/main?job=` URL when accounts are unavailable (no
 * Supabase admin) — a demo without a database still has to be able to pay.
 */
export async function jobPayLink(params: {
  jobId: string;
  phone: string;
}): Promise<string> {
  const issued = await issueAccountLink({
    phone: params.phone,
    jobId: params.jobId,
    purpose: ACCOUNT_LINK_PURPOSE.pay,
  }).catch((error) => {
    console.warn("[cascade] pay link issue failed", error);
    return null;
  });

  return issued?.url ?? getPayUrl(params.jobId);
}
