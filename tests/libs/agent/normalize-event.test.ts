import { describe, expect, it } from "vitest";
import { normalizeLinqEvent } from "@/libs/agent";

describe("normalizeLinqEvent", () => {
  it("normalizes a nested {data:{message}} envelope", () => {
    const event = normalizeLinqEvent({
      type: "message.received",
      data: {
        message: {
          id: "msg_1",
          text: "find me a plumber",
          from: "+15125550001",
          to: "+15125559999",
          chat_id: "chat_1",
        },
      },
    });
    expect(event).toEqual({
      eventType: "message.received",
      messageId: "msg_1",
      chatId: "chat_1",
      from: "+15125550001",
      to: "+15125559999",
      text: "find me a plumber",
    });
  });

  it("handles a flat payload with body/sender/recipient aliases", () => {
    const event = normalizeLinqEvent({
      event: "message.created",
      id: "msg_2",
      body: "hi",
      sender: "+1a",
      recipient: "+1b",
    });
    expect(event?.messageId).toBe("msg_2");
    expect(event?.text).toBe("hi");
  });

  it("ignores non-message and outbound events", () => {
    expect(normalizeLinqEvent({ type: "message.sent", message: { id: "x" } })).toBeNull();
    expect(normalizeLinqEvent({ type: "reaction.added" })).toBeNull();
  });

  it("returns null when required fields are missing", () => {
    expect(normalizeLinqEvent({ type: "message.received", message: { id: "x" } })).toBeNull();
    expect(normalizeLinqEvent("garbage")).toBeNull();
    expect(normalizeLinqEvent(null)).toBeNull();
  });
});
