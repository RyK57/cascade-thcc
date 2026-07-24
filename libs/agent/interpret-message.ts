import { AGENT_INTENT, type AgentIntent } from "./types";

const AFFIRM_PATTERN =
  /^(y|yes|yep|yeah|yea|ok|okay|sure|confirm|confirmed|approve|approved|accept|launch( it)?|go( ahead)?|do it|ship it|lgtm|sounds good|claim)( please)?[.!\s]*$/;

const DECLINE_PATTERN =
  /^(n|no|nope|nah|cancel|stop|pass|reject|rejected|decline|hold( off)?|not (yet|now)|don'?t)[.!\s]*$/;

const STATUS_PATTERN =
  /\b(status|progress|update|any news|how'?s it going|where are we|eta)\b/;

// "balance" is the customer-facing wording; "credits" is kept so older
// threads and anyone who learned the original phrasing still work.
const PAY_CREDITS_PATTERN =
  /\b(pay (with |in |from )?(credits?|balance)|use (credits?|balance)|(credits?|balance) please)\b/;

export function interpretMessage(text: string): AgentIntent {
  const normalized = text.trim().toLowerCase();

  if (PAY_CREDITS_PATTERN.test(normalized)) return AGENT_INTENT.payCredits;
  if (AFFIRM_PATTERN.test(normalized)) return AGENT_INTENT.affirm;
  if (DECLINE_PATTERN.test(normalized)) return AGENT_INTENT.decline;
  if (STATUS_PATTERN.test(normalized)) return AGENT_INTENT.status;
  return AGENT_INTENT.freeform;
}
