import { beforeEach, describe, expect, it, vi } from "vitest";
import { quotePeerJob } from "@/libs/agent/handle-peer-turn";
import { AGENT_ACTION } from "@/libs/agent/types";
import { JOB_STATUS, type Job } from "@/utils/schema/job";
import { updateJob } from "@/db/jobs";
import { createPayment } from "@/db/payments";

vi.mock("@/db/jobs", () => ({
  updateJob: vi.fn(),
  claimJob: vi.fn(),
  clearAssigneeAndReopen: vi.fn(),
}));

vi.mock("@/db/payments", () => ({
  createPayment: vi.fn(),
  getPaymentByJobId: vi.fn(),
}));

vi.mock("@/db/users", () => ({
  getUserByPhone: vi.fn(async () => null),
  upsertUserByPhone: vi.fn(),
  adjustCredits: vi.fn(),
  getUserByIdAdmin: vi.fn(),
  listPeers: vi.fn(async () => []),
}));

vi.mock("@/libs/linq", () => ({
  sendChatMessage: vi.fn(),
  sendTextMessage: vi.fn(),
  isLinqConfigured: vi.fn(() => false),
}));

vi.mock("@/libs/linq/payment-requests", () => ({
  createAgentPayRequest: vi.fn(),
  sendCheckoutLink: vi.fn(),
}));

vi.mock("@/libs/dynamic/treasury", () => ({
  payoutFromTreasury: vi.fn(),
}));

vi.mock("@/libs/dynamic/phone-wallet", () => ({
  ensurePhoneWallet: vi.fn(async (phone: string) => ({
    id: "33333333-3333-4333-8333-333333333333",
    phone,
    role: "both",
    creditBalance: 0,
    trustScore: 50,
    walletAddress: "0xabc",
    createdAt: "2026-07-24T00:00:00.000Z",
  })),
}));

vi.mock("@/db/bids", () => ({
  listJobBids: vi.fn(async () => []),
  upsertJobBid: vi.fn(),
  secondPriceClear: vi.fn(() => null),
}));

function makeJob(overrides: Partial<Job> = {}): Job {
  return {
    id: "22222222-2222-4222-8222-222222222222",
    linqChatId: "chat_peer",
    requesterHandle: "+15555550999",
    title: "Test my signup flow",
    description: "on a real phone",
    status: JOB_STATUS.intake,
    tier: "peer",
    priceUsdCents: 1200,
    createdAt: "2026-07-24T00:00:00.000Z",
    updatedAt: "2026-07-24T00:00:00.000Z",
    ...overrides,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(updateJob).mockImplementation(async (_id, input) =>
    makeJob(input as Partial<Job>)
  );
  vi.mocked(createPayment).mockResolvedValue({
    id: "pay_peer",
    jobId: "22222222-2222-4222-8222-222222222222",
    amountCents: 1200,
    currency: "usd",
    status: "payment_pending",
    createdAt: "2026-07-24T00:00:00.000Z",
    updatedAt: "2026-07-24T00:00:00.000Z",
  });
});

describe("quotePeerJob", () => {
  it("creates a sandbox payment and wallet-first quote", async () => {
    const outcome = await quotePeerJob(makeJob());
    expect(createPayment).toHaveBeenCalled();
    expect(outcome.action).toBe(AGENT_ACTION.quoted);
    expect(outcome.reply.toLowerCase()).toContain("cascade wallet");
    expect(outcome.reply).toContain("/main?job=");
  });
});
