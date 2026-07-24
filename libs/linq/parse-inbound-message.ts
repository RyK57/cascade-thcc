import type { LinqAPIV3 } from "@linqapp/sdk";
import { createLinqClient } from "./client";

export interface InboundLinqMessage {
  kind: "text";
  eventId: string;
  messageId: string;
  chatId: string;
  senderHandle: string;
  text: string;
  /** Presigned image URLs from media parts (photos texted in). */
  mediaUrls?: string[];
}

export interface InboundLinqReaction {
  kind: "reaction";
  eventId: string;
  messageId: string;
  chatId: string;
  senderHandle: string;
  reactionType: string;
  /** Synthetic idempotency key for job_messages. */
  reactionId: string;
  isAffirm: boolean;
}

export type InboundLinqEvent = InboundLinqMessage | InboundLinqReaction;

const AFFIRM_REACTIONS = new Set(["love", "like"]);
const DECLINE_REACTIONS = new Set(["dislike"]);

function getLinqWebhookSecret(): string | undefined {
  return process.env.LINQ_WEBHOOK_SECRET?.trim() || undefined;
}

function unwrapEvent(
  body: string,
  headers: Record<string, string>
): LinqAPIV3.UnwrapWebhookEvent {
  const secret = getLinqWebhookSecret();
  return secret
    ? createLinqClient().webhooks.unwrap(body, { headers, key: secret })
    : (JSON.parse(body) as LinqAPIV3.UnwrapWebhookEvent);
}

/**
 * Parses a Linq webhook into inbound text or an affirm/decline tapback.
 */
export function parseInboundMessage(
  body: string,
  headers: Record<string, string>
): InboundLinqEvent | null {
  const event = unwrapEvent(body, headers);

  if (event.event_type === "reaction.added") {
    const { data } = event as LinqAPIV3.ReactionAddedWebhookEvent;
    if (data.is_from_me) return null;
    const chatId = data.chat_id;
    const messageId = data.message_id;
    const senderHandle =
      data.from_handle?.handle ?? data.from ?? undefined;
    if (!chatId || !messageId || !senderHandle) return null;

    const reactionType = data.reaction_type;
    const isAffirm =
      AFFIRM_REACTIONS.has(reactionType) ||
      (reactionType === "custom" &&
        Boolean(data.custom_emoji && /❤️|👍|✔|✅/.test(data.custom_emoji)));
    const isDecline =
      DECLINE_REACTIONS.has(reactionType) ||
      (reactionType === "custom" &&
        Boolean(data.custom_emoji && /👎|❌|❎/.test(data.custom_emoji)));

    if (!isAffirm && !isDecline) return null;

    return {
      kind: "reaction",
      eventId: event.event_id,
      messageId,
      chatId,
      senderHandle,
      reactionType,
      reactionId: `reaction:${event.event_id}`,
      isAffirm,
    };
  }

  if (event.event_type !== "message.received") return null;

  const { data } = event as LinqAPIV3.MessageReceivedWebhookEvent;
  if (data.direction !== "inbound") return null;

  const text = data.parts
    .filter((part) => part.type === "text")
    .map((part) => part.value)
    .join("\n")
    .trim();

  // Presigned URLs (1h expiry) for inbound photos — glasses shots, task
  // context images. Caption them promptly; don't persist the URLs.
  const mediaUrls = data.parts.flatMap((part) =>
    part.type === "media" &&
    "url" in part &&
    part.mime_type?.startsWith("image/") &&
    part.url
      ? [part.url]
      : []
  );

  if (!text && mediaUrls.length === 0) return null;

  return {
    kind: "text",
    eventId: event.event_id,
    messageId: data.id,
    chatId: data.chat.id,
    senderHandle: data.sender_handle.handle,
    text,
    mediaUrls,
  };
}
