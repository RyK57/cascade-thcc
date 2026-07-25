import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const getLatestJobByHandle = vi.fn();
const issueAccountLink = vi.fn();
const sendChatMessage = vi.fn();
const sendTextMessage = vi.fn();
const isLinqConfigured = vi.fn(() => true);

vi.mock("@/db/jobs", () => ({
  getLatestJobByHandle: (...args: unknown[]) => getLatestJobByHandle(...args),
}));

vi.mock("@/libs/account/issue-link", () => ({
  issueAccountLink: (...args: unknown[]) => issueAccountLink(...args),
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
  REQUEST_CODE_ERROR,
  requestAccountCode,
} from "@/libs/account/request-code";

const PHONE = "+15122263512";
const LINE = "+15550004242";

beforeEach(() => {
  vi.clearAllMocks();
  vi.stubEnv("LINQ_FROM_NUMBER", LINE);
  isLinqConfigured.mockReturnValue(true);
  getLatestJobByHandle.mockResolvedValue({ linqChatId: "chat_1" });
  issueAccountLink.mockResolvedValue({
    url: "https://cascade.test/l/token",
    code: "123456",
    expiresAt: new Date(),
  });
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("requestAccountCode", () => {
  it("replies in the thread the person already has with Cascade", async () => {
    const result = await requestAccountCode(PHONE);

    expect(result).toEqual({ ok: true, phone: PHONE, delivered: true });
    expect(sendChatMessage).toHaveBeenCalledWith(
      expect.objectContaining({ chatId: "chat_1" })
    );
    expect(sendChatMessage.mock.calls[0][0].text).toContain("123456");
    expect(sendTextMessage).not.toHaveBeenCalled();
  });

  it("opens a fresh chat for a number that never texted the line", async () => {
    // The person typed this number on the site seconds ago — the code text is
    // solicited, and issuing the challenge created their account row.
    getLatestJobByHandle.mockResolvedValue(null);

    const result = await requestAccountCode("+15550001111");

    expect(result).toEqual({
      ok: true,
      phone: "+15550001111",
      delivered: true,
    });
    expect(sendTextMessage).toHaveBeenCalledWith(
      expect.objectContaining({ from: LINE, to: ["+15550001111"] })
    );
    expect(sendTextMessage.mock.calls[0][0].text).toContain("123456");
    expect(sendChatMessage).not.toHaveBeenCalled();
  });

  it("reports undelivered when no from-number is set for a fresh chat", async () => {
    getLatestJobByHandle.mockResolvedValue(null);
    vi.stubEnv("LINQ_FROM_NUMBER", "");
    vi.stubEnv("LINQ_PHONE_NUMBER", "");

    expect(await requestAccountCode("+15550001111")).toEqual({
      ok: true,
      phone: "+15550001111",
      delivered: false,
    });
    expect(sendTextMessage).not.toHaveBeenCalled();
  });

  it("fails only when the challenge itself cannot be stored", async () => {
    issueAccountLink.mockResolvedValue(null);

    expect(await requestAccountCode(PHONE)).toEqual({
      ok: false,
      error: REQUEST_CODE_ERROR.unavailable,
    });
    expect(sendChatMessage).not.toHaveBeenCalled();
  });

  it("reports undelivered rather than pretending when Linq is off", async () => {
    isLinqConfigured.mockReturnValue(false);

    expect(await requestAccountCode(PHONE)).toEqual({
      ok: true,
      phone: PHONE,
      delivered: false,
    });
  });

  it("does not fail the request when the send throws", async () => {
    sendChatMessage.mockRejectedValue(new Error("linq down"));

    expect(await requestAccountCode(PHONE)).toEqual({
      ok: true,
      phone: PHONE,
      delivered: false,
    });
  });

  it("normalizes the handle before looking for a thread", async () => {
    await requestAccountCode("+1 (512) 226-3512");

    expect(getLatestJobByHandle).toHaveBeenCalledWith(PHONE);
  });
});
