/**
 * Normalized inbound message, decoupled from Linq's raw webhook envelope.
 * `from` = the person who texted us, `to` = our Linq number.
 */
export interface NormalizedInbound {
  eventType: string;
  messageId: string;
  chatId?: string;
  from: string;
  to: string;
  text: string;
}

function pickString(...values: unknown[]): string | undefined {
  for (const value of values) {
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return undefined;
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" ? (value as Record<string, unknown>) : {};
}

/**
 * Tolerant normalizer for Linq webhook payloads.
 *
 * NOTE: field names are inferred from the Linq skill docs, not yet verified
 * against a live payload. Run `linq webhooks listen --forward-to
 * http://localhost:3000/api/linq/webhook` and confirm the shape, then tighten.
 *
 * Returns null for non-message events or anything missing an id/text so the
 * webhook can safely ignore it.
 */
export function normalizeLinqEvent(raw: unknown): NormalizedInbound | null {
  const root = asRecord(raw);
  const eventType = pickString(root.type, root.event, root.event_type) ?? "unknown";

  // Only act on inbound messages; ignore delivery receipts, reactions, etc.
  if (eventType !== "unknown" && !eventType.includes("message")) return null;
  if (eventType.includes("sent") || eventType.includes("delivered")) return null;

  // Dig through the common envelope nestings: {data:{message:{...}}}, {message:{...}}, or flat.
  const data = asRecord(root.data);
  const message = asRecord(data.message ?? root.message ?? root);

  const messageId = pickString(message.id, message.message_id, data.id, root.id);
  const text = pickString(
    message.text,
    message.body,
    message.value,
    asRecord(message.content).text
  );
  const from = pickString(message.from, message.sender, message.author, root.from);
  const to = pickString(message.to, message.recipient, root.to);
  const chatId = pickString(message.chat_id, message.chatId, data.chat_id, root.chat_id);

  if (!messageId || !text || !from || !to) return null;

  return { eventType, messageId, chatId, from, to, text };
}
