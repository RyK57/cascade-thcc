import { createLinqClient } from "./client";
import { withRetryAfter } from "./rate-limit";

export interface SendChatMessageParams {
  chatId: string;
  text: string;
  idempotencyKey?: string;
  replyToMessageId?: string;
  effect?: "confetti";
  recipientKey?: string;
}

export async function sendChatMessage({
  chatId,
  text,
  idempotencyKey,
  replyToMessageId,
  effect,
  recipientKey,
}: SendChatMessageParams) {
  const client = createLinqClient();

  return withRetryAfter(
    () =>
      client.chats.messages.send(
        chatId,
        {
          message: {
            parts: [{ type: "text", value: text }],
            ...(replyToMessageId
              ? { reply_to: { message_id: replyToMessageId } }
              : {}),
            ...(effect
              ? { effect: { type: "screen" as const, name: effect } }
              : {}),
          },
        },
        idempotencyKey ? { idempotencyKey } : undefined
      ),
    recipientKey ?? chatId
  );
}
