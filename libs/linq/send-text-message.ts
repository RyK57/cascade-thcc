import { createLinqClient } from "./client";

interface SendTextMessageParams {
  from: string;
  to: string[];
  text: string;
}

export async function sendTextMessage({
  from,
  to,
  text,
}: SendTextMessageParams) {
  const client = createLinqClient();

  return client.chats.create({
    from,
    to,
    message: {
      parts: [{ type: "text", value: text }],
    },
  });
}
