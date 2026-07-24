/**
 * Thread history, shaped for an LLM `messages` array.
 *
 * Cascade stores every inbound and outbound message on the job, but a job row
 * is reused for the whole iMessage thread — so replaying that log is what lets
 * triage and the AI answer treat a follow-up as a follow-up instead of a fresh
 * request.
 */

/** Structural view of a stored message; `JobMessage` from `db/jobs` satisfies it. */
export interface ConversationMessage {
  direction: "inbound" | "outbound";
  body: string;
}

export interface ConversationTurn {
  role: "user" | "assistant";
  content: string;
}

/** Longest single message replayed into a prompt. */
const MAX_TURN_CHARS = 2000;

function clip(text: string): string {
  return text.trim().slice(0, MAX_TURN_CHARS);
}

/**
 * Stored messages → alternating LLM turns. Same-role runs are merged and a
 * leading assistant run is dropped: both providers expect the first turn to
 * come from the user, and Cascade opens some threads with an outbound card.
 */
export function toConversationTurns(
  messages: ConversationMessage[]
): ConversationTurn[] {
  const turns: ConversationTurn[] = [];

  for (const message of messages) {
    const content = clip(message.body);
    if (!content) continue;

    const role = message.direction === "inbound" ? "user" : "assistant";
    if (turns.length === 0 && role === "assistant") continue;

    const last = turns[turns.length - 1];
    if (last && last.role === role) {
      last.content = `${last.content}\n${content}`;
      continue;
    }

    turns.push({ role, content });
  }

  return turns;
}

/**
 * History plus the text being handled this turn, so the live request is always
 * the final user message.
 */
export function appendUserTurn(
  turns: ConversationTurn[],
  text: string
): ConversationTurn[] {
  const content = clip(text);
  if (!content) return turns;

  const last = turns[turns.length - 1];
  if (last?.role === "user") {
    return [
      ...turns.slice(0, -1),
      { role: "user", content: `${last.content}\n${content}` },
    ];
  }

  return [...turns, { role: "user", content }];
}
