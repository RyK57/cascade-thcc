import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Requirement: a first-time texter must own a verified account before Cascade
 * does any work. This drives the real turn pipeline and asserts what the agent
 * does and does not do on either side of that gate.
 */

const verified = new Set<string>();
const jobs = new Map<string, Record<string, unknown>>();
const recordedMessages: { direction: string; body: string }[] = [];
const sentTexts: string[] = [];

const triageJob = vi.fn();
const handleJobTurn = vi.fn();
const issueAccountLink = vi.fn();

vi.mock("@/db/jobs", () => ({
  MESSAGE_DIRECTION: { inbound: "inbound", outbound: "outbound" },
  createJob: vi.fn(async (input: Record<string, unknown>) => {
    const job = {
      id: "job_1",
      status: "intake",
      statusCardIsRich: false,
      walletRefuseCount: 0,
      createdAt: "2026-07-24T00:00:00.000Z",
      updatedAt: "2026-07-24T00:00:00.000Z",
      ...input,
    };
    jobs.set("chat_1", job);
    return job;
  }),
  getJobByChatId: vi.fn(async (chatId: string) => jobs.get(chatId) ?? null),
  getJobByClaimChatId: vi.fn(async () => null),
  getJobByStatusCardMessageId: vi.fn(async () => null),
  getOldestClaimablePeerJob: vi.fn(async () => null),
  listJobMessages: vi.fn(async () => []),
  recordJobMessage: vi.fn(async (input: { direction: string; body: string }) => {
    recordedMessages.push({ direction: input.direction, body: input.body });
    return true;
  }),
}));

vi.mock("@/db/users", () => ({
  getUserByPhone: vi.fn(async (phone: string) =>
    verified.has(phone)
      ? { id: "user_1", phone, phoneVerifiedAt: "2026-07-24T00:00:00.000Z" }
      : { id: "user_1", phone }
  ),
}));

vi.mock("@/utils/supabase/admin", () => ({
  isSupabaseAdminConfigured: vi.fn(() => true),
}));

vi.mock("@/libs/dynamic/phone-wallet", () => ({
  ensurePhoneWallet: vi.fn(async () => ({})),
}));

vi.mock("@/libs/runware", () => ({
  captionImage: vi.fn(),
  isRunwareConfigured: vi.fn(() => false),
}));

vi.mock("@/libs/linq", () => ({
  markChatRead: vi.fn(),
  setTyping: vi.fn(),
  sendChatMessage: vi.fn(async ({ text }: { text: string }) => {
    sentTexts.push(text);
    return { message: { id: "out_1" } };
  }),
}));

vi.mock("@/libs/account/issue-link", () => ({
  issueAccountLink: (...a: unknown[]) => issueAccountLink(...a),
}));

vi.mock("@/libs/agent/triage", () => ({
  triageJob: (...a: unknown[]) => triageJob(...a),
}));

vi.mock("@/libs/agent/handle-job-turn", () => ({
  clipTitle: (t: string) => t.slice(0, 80),
  isAwaitingClarification: () => false,
  handleJobTurn: (...a: unknown[]) => handleJobTurn(...a),
}));

import { runAgentTurn } from "@/libs/agent/run-agent-turn";
import { AGENT_ACTION } from "@/libs/agent/types";

const PHONE = "+15122263512";

function inboundText(text: string) {
  const id = `msg_${Math.random()}`;
  return {
    kind: "text" as const,
    eventId: `evt_${id}`,
    chatId: "chat_1",
    senderHandle: PHONE,
    messageId: id,
    text,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  verified.clear();
  jobs.clear();
  recordedMessages.length = 0;
  sentTexts.length = 0;
  issueAccountLink.mockResolvedValue({
    url: "https://cascade.example.com/l/tok",
    code: "123456",
    expiresAt: new Date(),
  });
  triageJob.mockResolvedValue({
    tier: "peer",
    jobSummary: "Test my signup",
    reason: "needs a person",
    needsClarification: false,
    priceEstimateUsd: 12,
  });
  handleJobTurn.mockResolvedValue({
    action: AGENT_ACTION.quoted,
    reply: "Quote for your job: $12.00",
  });
});

describe("first message from an unverified number", () => {
  it("asks for signup instead of doing the work", async () => {
    const result = await runAgentTurn(
      inboundText("have someone test my signup flow")
    );

    expect(result.action).toBe(AGENT_ACTION.signupRequired);
    expect(result.reply).toContain("https://cascade.example.com/l/tok");

    // Nothing is triaged, quoted or charged before the account exists.
    expect(triageJob).not.toHaveBeenCalled();
    expect(handleJobTurn).not.toHaveBeenCalled();
  });

  it("still persists the request so it is not lost", async () => {
    await runAgentTurn(inboundText("have someone test my signup flow"));

    expect(jobs.get("chat_1")).toMatchObject({ requesterHandle: PHONE });
    expect(recordedMessages).toContainEqual({
      direction: "inbound",
      body: "have someone test my signup flow",
    });
  });

  it("issues the signup link for the number that texted", async () => {
    await runAgentTurn(inboundText("hi"));

    expect(issueAccountLink).toHaveBeenCalledWith({ phone: PHONE });
  });

  it("keeps asking until the number is actually verified", async () => {
    await runAgentTurn(inboundText("hi"));
    const second = await runAgentTurn(inboundText("still here"));

    expect(second.action).toBe(AGENT_ACTION.signupRequired);
    expect(handleJobTurn).not.toHaveBeenCalled();
  });
});

describe("after the number is verified", () => {
  it("picks the conversation back up and quotes", async () => {
    await runAgentTurn(inboundText("have someone test my signup flow"));

    // Signup completed on the website.
    verified.add(PHONE);

    const result = await runAgentTurn(inboundText("still need that test"));

    expect(triageJob).toHaveBeenCalled();
    expect(handleJobTurn).toHaveBeenCalled();
    expect(result.action).toBe(AGENT_ACTION.quoted);
    expect(result.reply).toContain("$12.00");
  });
});
