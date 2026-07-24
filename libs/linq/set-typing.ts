import { createLinqClient } from "./client";

export async function setTyping(chatId: string, isTyping: boolean): Promise<void> {
  const client = createLinqClient();
  if (isTyping) {
    await client.chats.typing.start(chatId);
    return;
  }
  await client.chats.typing.stop(chatId);
}
