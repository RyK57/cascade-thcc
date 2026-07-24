import { beforeEach, describe, expect, it, vi } from "vitest";

const getLatestJobByHandle = vi.fn();
const issueAccountLink = vi.fn();
const sendChatMessage = vi.fn();
const isLinqConfigured = vi.fn(() => true);

vi.mock("@/db/jobs", () => ({
  getLatestJobByHandle: (...args: unknown[]) => getLatestJobByHandle(...args),
}));

vi.mock("@/libs/account/issue-link", () => ({
  issueAccountLink: (...args: unknown[]) => issueAccountLink(...args),
}));

vi.mock("@/libs/linq", () => ({
  isLinqConfigured: () => isLinqConfigured(),
  sendChatMessage: (...args: unknown[]) => sendChatMessage(...args),
}));

import {
  REQUEST_CODE_ERROR,
  requestAccountCode,
} from "@/libs/account/request-code";

const PHONE = "+15122263512";

beforeEach(() => {
  vi.clearAllMocks();
  isLinqConfigured.mockReturnValue(true);
  getLatestJobByHandle.mockResolvedValue({ linqChatId: "chat_1" });
  issueAccountLink.mockResolvedValue({
    url: "https://cascade.test/l/token",
    code: "123456",
    expiresAt: new Date(),
  });
});

describe("requestAccountCode", () => {
  it("replies in the thread the person already has with Cascade", async () => {
    const result = await requestAccountCode(PHONE);

    expect(result).toEqual({ ok: true, phone: PHONE, delivered: true });
    expect(sendChatMessage).toHaveBeenCalledWith(
      expect.objectContaining({ chatId: "chat_1" })
    );
    expect(sendChatMessage.mock.calls[0][0].text).toContain("123456");
  });

  it("refuses a number that never texted the line", async () => {
    // Texting a code to a stranger is cold outbound, which the channel forbids
    // — and it would turn this endpoint into an SMS cannon.
    getLatestJobByHandle.mockResolvedValue(null);

    expect(await requestAccountCode("+15550001111")).toEqual({
      ok: false,
      error: REQUEST_CODE_ERROR.unknownPhone,
    });
    expect(issueAccountLink).not.toHaveBeenCalled();
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
