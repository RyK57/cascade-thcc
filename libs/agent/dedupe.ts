/**
 * Idempotency guard so a redelivered webhook doesn't run the agent twice.
 *
 * In-memory for now. TODO: back with Supabase (e.g. db/chats) so it survives
 * restarts and works across serverless instances. Fine for a single-instance demo.
 */
const seen = new Set<string>();

export function seenMessage(messageId: string): boolean {
  return seen.has(messageId);
}

export function markMessageSeen(messageId: string): void {
  seen.add(messageId);
}
