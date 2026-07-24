import { AGENT_INTENT, type AgentIntent } from "./types";

const AFFIRM_PATTERN =
  /^(y|yes|yep|yeah|yea|ok|okay|sure|confirm|confirmed|approve|approved|accept|launch( it)?|go( ahead)?|do it|ship it|lgtm|sounds good|claim)( please)?[.!\s]*$/;

// A bare "no" is contextual — it rejects whatever was just offered. "stop" and
// "cancel" are not: they mean end the whole job, at any stage. Kept out of
// DECLINE_PATTERN so the two can never be confused.
const STOP_PATTERN =
  /^(stop|cancel( (it|that|this|the (job|task|order)))?|abort|never ?mind|forget it|call it off)[.!\s]*$/;

const DECLINE_PATTERN =
  /^(n|no|nope|nah|pass|reject|rejected|decline|hold( off)?|not (yet|now)|don'?t)[.!\s]*$/;

const STATUS_PATTERN =
  /\b(status|progress|update|any news|how'?s it going|where are we|eta)\b/;

// "balance" is the customer-facing wording; "credits" is kept so older
// threads and anyone who learned the original phrasing still work.
const PAY_CREDITS_PATTERN =
  /\b(pay (with |in |from )?(credits?|balance)|use (credits?|balance)|(credits?|balance) please)\b/;

/**
 * "Show me my stuff on the web." Deliberately narrow: this short-circuits
 * triage, so a task that merely mentions an account must still be triaged.
 */
const ACCOUNT_LINK_PATTERN =
  /^(link|link (me|my account)|account|my (account|jobs|payments|receipts)|show (me )?my (jobs|account|payments|receipts)|dashboard|open (the )?(web|app|dashboard)|sign me in|log ?in)[.!\s]*$/;

const PAY_IN_ETH_PATTERN = /\b(pay (with |in )?eth(er(eum)?)?|use eth(er(eum)?)?|in eth)\b/;
const PAY_IN_USDC_PATTERN =
  /\b(pay (with |in )?(usdc|stablecoins?|stables?)|use (usdc|stablecoins?)|in usdc)\b/;

/**
 * Which asset the requester asked to settle in, or null when they didn't say.
 * Kept separate from `interpretMessage` because it is orthogonal to intent —
 * "yes, pay in eth" is both an affirm and an asset choice.
 */
export function interpretPayAsset(text: string): "eth" | "usdc" | null {
  const normalized = text.trim().toLowerCase();
  if (PAY_IN_ETH_PATTERN.test(normalized)) return "eth";
  if (PAY_IN_USDC_PATTERN.test(normalized)) return "usdc";
  return null;
}

export function interpretMessage(text: string): AgentIntent {
  const normalized = text.trim().toLowerCase();

  if (ACCOUNT_LINK_PATTERN.test(normalized)) return AGENT_INTENT.accountLink;
  if (PAY_CREDITS_PATTERN.test(normalized)) return AGENT_INTENT.payCredits;
  // Before affirm/decline: "stop" outranks whatever the thread was asking.
  if (STOP_PATTERN.test(normalized)) return AGENT_INTENT.stop;
  if (AFFIRM_PATTERN.test(normalized)) return AGENT_INTENT.affirm;
  if (DECLINE_PATTERN.test(normalized)) return AGENT_INTENT.decline;
  if (STATUS_PATTERN.test(normalized)) return AGENT_INTENT.status;
  return AGENT_INTENT.freeform;
}
