import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const getLatestJobByHandle = vi.fn();
const sendChatMessage = vi.fn();
const sendTextMessage = vi.fn();
const isLinqConfigured = vi.fn(() => true);

vi.mock("@/db/jobs", () => ({
  getLatestJobByHandle: (...args: unknown[]) => getLatestJobByHandle(...args),
}));

vi.mock("@/libs/linq", async () => {
  const actual =
    await vi.importActual<typeof import("@/libs/linq")>("@/libs/linq");
  return {
    ...actual,
    isLinqConfigured: () => isLinqConfigured(),
    sendChatMessage: (...args: unknown[]) => sendChatMessage(...args),
    sendTextMessage: (...args: unknown[]) => sendTextMessage(...args),
  };
});

import {
  accountIntroMessage,
  sendAccountIntro,
} from "@/libs/account/send-intro";

const PHONE = "+15122263512";
const LINE = "+15550004242";

beforeEach(() => {
  vi.clearAllMocks();
  vi.stubEnv("LINQ_FROM_NUMBER", LINE);
  isLinqConfigured.mockReturnValue(true);
  getLatestJobByHandle.mockResolvedValue(null);
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("sendAccountIntro", () => {
  it("introduces itself in a fresh chat to a newly linked number", async () => {
    expect(await sendAccountIntro(PHONE)).toBe(true);
    expect(sendTextMessage).toHaveBeenCalledWith({
      from: LINE,
      to: [PHONE],
      text: accountIntroMessage(),
    });
  });

  it("greets in the existing thread when the number already has one", async () => {
    getLatestJobByHandle.mockResolvedValue({ linqChatId: "chat_1" });

    expect(await sendAccountIntro(PHONE)).toBe(true);
    expect(sendChatMessage).toHaveBeenCalledWith({
      chatId: "chat_1",
      text: accountIntroMessage(),
    });
    expect(sendTextMessage).not.toHaveBeenCalled();
  });

  it("skips quietly when Linq is not configured", async () => {
    isLinqConfigured.mockReturnValue(false);

    expect(await sendAccountIntro(PHONE)).toBe(false);
    expect(sendTextMessage).not.toHaveBeenCalled();
  });

  it("skips quietly when no from-number is set", async () => {
    vi.stubEnv("LINQ_FROM_NUMBER", "");
    vi.stubEnv("LINQ_PHONE_NUMBER", "");

    expect(await sendAccountIntro(PHONE)).toBe(false);
  });

  it("reports failure instead of throwing when the send dies", async () => {
    sendTextMessage.mockRejectedValue(new Error("linq down"));

    expect(await sendAccountIntro(PHONE)).toBe(false);
  });

  it("opens with the assistant introducing itself and invites a reply", async () => {
    // Channel rule: conversational, not broadcast — the intro must ask for
    // something back.
    expect(accountIntroMessage()).toMatch(/^Hi — I'm Cascade/);
    expect(accountIntroMessage()).toMatch(/\?$/);
  });
});
