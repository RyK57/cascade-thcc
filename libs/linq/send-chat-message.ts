import { createLinqClient } from "./client";

interface SendChatMessageParams {
  chatId: string;
  text: string;
}

export async function sendChatMessage({ chatId, text }: SendChatMessageParams) {
  const client = createLinqClient();

  return client.chats.messages.send(chatId, {
    message: {
      parts: [{ type: "text", value: text }],
    },
  });
}
