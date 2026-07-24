import { describe, expect, it } from "vitest";
import {
  appendUserTurn,
  toConversationTurns,
  type ConversationMessage,
} from "@/libs/agent/conversation";

const inbound = (body: string): ConversationMessage => ({
  direction: "inbound",
  body,
});
const outbound = (body: string): ConversationMessage => ({
  direction: "outbound",
  body,
});

describe("toConversationTurns", () => {
  it("maps inbound to user and outbound to assistant, oldest first", () => {
    expect(
      toConversationTurns([
        inbound("what's a good pricing model?"),
        outbound("Try per-seat to start."),
        inbound("make it usage-based"),
      ])
    ).toEqual([
      { role: "user", content: "what's a good pricing model?" },
      { role: "assistant", content: "Try per-seat to start." },
      { role: "user", content: "make it usage-based" },
    ]);
  });

  it("drops a leading assistant run so the thread opens on a user turn", () => {
    expect(
      toConversationTurns([outbound("Cascade here — text what you need."), inbound("hi")])
    ).toEqual([{ role: "user", content: "hi" }]);
  });

  it("merges same-role runs, since the peer flow sends cards back to back", () => {
    expect(
      toConversationTurns([
        inbound("test my signup"),
        outbound("Routing to a peer."),
        outbound("❤️ approve after funding"),
      ])
    ).toEqual([
      { role: "user", content: "test my signup" },
      { role: "assistant", content: "Routing to a peer.\n❤️ approve after funding" },
    ]);
  });

  it("skips blank bodies", () => {
    expect(toConversationTurns([inbound("hi"), outbound("   ")])).toEqual([
      { role: "user", content: "hi" },
    ]);
  });

  it("clips a long message rather than dropping it", () => {
    const [turn] = toConversationTurns([inbound("x".repeat(5000))]);
    expect(turn.content).toHaveLength(2000);
  });
});

describe("appendUserTurn", () => {
  it("puts the live request last", () => {
    const history = toConversationTurns([
      inbound("what's a good pricing model?"),
      outbound("Try per-seat to start."),
    ]);
    expect(appendUserTurn(history, "make it usage-based")).toEqual([
      { role: "user", content: "what's a good pricing model?" },
      { role: "assistant", content: "Try per-seat to start." },
      { role: "user", content: "make it usage-based" },
    ]);
  });

  it("merges into a trailing user turn when an outbound never recorded", () => {
    const history = toConversationTurns([inbound("need help")]);
    expect(appendUserTurn(history, "with my landing page")).toEqual([
      { role: "user", content: "need help\nwith my landing page" },
    ]);
  });

  it("works from empty history", () => {
    expect(appendUserTurn([], "first message")).toEqual([
      { role: "user", content: "first message" },
    ]);
  });

  it("does not mutate the history it was given", () => {
    const history = toConversationTurns([inbound("one")]);
    appendUserTurn(history, "two");
    expect(history).toEqual([{ role: "user", content: "one" }]);
  });
});
