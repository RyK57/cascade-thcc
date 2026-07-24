import type { LinqAPIV3 } from "@linqapp/sdk";
import { createLinqClient } from "./client";

export interface InboundLinqMessage {
  eventId: string;
  messageId: string;
  chatId: string;
  senderHandle: string;
  text: string;
}

function getLinqWebhookSecret(): string | undefined {
  return process.env.LINQ_WEBHOOK_SECRET?.trim() || undefined;
}

/**
 * Parses a Linq webhook request into an inbound text message, or null for
 * events the agent ignores (outbound echoes, receipts, non-text parts).
 * Signature verification runs only when LINQ_WEBHOOK_SECRET is set — local
 * `linq webhooks listen` forwarding is unsigned.
 */
export function parseInboundMessage(
  body: string,
  headers: Record<string, string>
): InboundLinqMessage | null {
  const secret = getLinqWebhookSecret();

  const event = secret
    ? createLinqClient().webhooks.unwrap(body, { headers, key: secret })
    : (JSON.parse(body) as LinqAPIV3.UnwrapWebhookEvent);

  if (event.event_type !== "message.received") return null;

  const { data } = event as LinqAPIV3.MessageReceivedWebhookEvent;
  if (data.direction !== "inbound") return null;

  const text = data.parts
    .filter((part) => part.type === "text")
    .map((part) => part.value)
    .join("\n")
    .trim();

  if (!text) return null;

  return {
    eventId: event.event_id,
    messageId: data.id,
    chatId: data.chat.id,
    senderHandle: data.sender_handle.handle,
    text,
  };
}
