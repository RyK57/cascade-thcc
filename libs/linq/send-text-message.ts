import { createLinqClient } from "./client";
import { withRetryAfter } from "./rate-limit";

interface SendTextMessageParams {
  from: string;
  to: string[];
  text: string;
}

/**
 * Start a new chat with a plain text message. Metered like every other
 * outbound send — this is the peer-broadcast fan-out path, which sends N
 * new-conversation messages per funded job and so is the one that most needs
 * the cap.
 */
export async function sendTextMessage({
  from,
  to,
  text,
}: SendTextMessageParams) {
  const client = createLinqClient();

  return withRetryAfter(
    () =>
      client.chats.create({
        from,
        to,
        message: {
          parts: [{ type: "text", value: text }],
        },
      }),
    to[0]
  );
}
