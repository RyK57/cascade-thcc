import { describe, expect, it, vi } from "vitest";

vi.mock("@/libs/linq/client", () => ({
  createLinqClient: vi.fn(),
  isLinqConfigured: vi.fn(() => true),
}));

import { parseInboundMessage } from "@/libs/linq/parse-inbound-message";

describe("parseInboundMessage", () => {
  it("parses inbound text messages", () => {
    const body = JSON.stringify({
      event_type: "message.received",
      event_id: "evt_1",
      data: {
        id: "msg_1",
        direction: "inbound",
        chat: { id: "chat_1" },
        sender_handle: { handle: "+15550001111" },
        parts: [{ type: "text", value: "hello" }],
      },
    });

    const result = parseInboundMessage(body, {});
    expect(result).toMatchObject({
      kind: "text",
      messageId: "msg_1",
      chatId: "chat_1",
      text: "hello",
    });
  });

  it("parses affirming love tapbacks", () => {
    const body = JSON.stringify({
      event_type: "reaction.added",
      event_id: "evt_r1",
      data: {
        is_from_me: false,
        reaction_type: "love",
        chat_id: "chat_1",
        message_id: "msg_card",
        from_handle: { handle: "+15550001111" },
      },
    });

    const result = parseInboundMessage(body, {});
    expect(result).toMatchObject({
      kind: "reaction",
      isAffirm: true,
      messageId: "msg_card",
      chatId: "chat_1",
    });
  });

  it("ignores non-affirming reactions", () => {
    const body = JSON.stringify({
      event_type: "reaction.added",
      event_id: "evt_r2",
      data: {
        is_from_me: false,
        reaction_type: "dislike",
        chat_id: "chat_1",
        message_id: "msg_card",
        from_handle: { handle: "+15550001111" },
      },
    });
    expect(parseInboundMessage(body, {})).toBeNull();
  });
});
