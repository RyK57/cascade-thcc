import { createLinqClient } from "./client";

/**
 * Send a read receipt for the chat, so the requester sees "Read" instead of a
 * message that looks ignored while Cascade triages. Mirrors `setTyping`: the
 * caller treats it as best-effort.
 */
export async function markChatRead(chatId: string): Promise<void> {
  const client = createLinqClient();
  await client.chats.markAsRead(chatId);
}
