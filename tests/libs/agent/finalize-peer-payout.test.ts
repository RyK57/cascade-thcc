import { beforeEach, describe, expect, it, vi } from "vitest";
import { AGENT_ACTION, finalizePeerPayout } from "@/libs/agent";
import { JOB_STATUS, type Job } from "@/utils/schema/job";
import { PAYMENT_STATUS } from "@/utils/schema/payment";

vi.mock("@/db/jobs", () => ({
  updateJob: vi.fn(async (id: string, input: { status?: string }) => ({
    id,
    status: input.status ?? JOB_STATUS.paid,
    title: "Job",
    linqChatId: "chat",
    requesterHandle: "+1",
    createdAt: "t",
    updatedAt: "t",
  })),
}));

vi.mock("@/db/payments", () => ({
  getPaymentByJobId: vi.fn(),
  claimEscrowRelease: vi.fn(),
  createPayment: vi.fn(),
}));

vi.mock("@/db/users", () => ({
  adjustCredits: vi.fn(),
  getUserByIdAdmin: vi.fn(async () => null),
  listPeers: vi.fn(async () => []),
  upsertUserByPhone: vi.fn(),
  getUserByPhone: vi.fn(),
}));

vi.mock("@/libs/dynamic/pay-worker", () => ({
  payWorkerUsdc: vi.fn(async () => ({
    txHash: "0xpay",
    explorerUrl: "https://sepolia.basescan.org/tx/0xpay",
  })),
}));

vi.mock("@/libs/dynamic/treasury", () => ({
  payoutFromTreasury: vi.fn(async () => ({
    txHash: "0xtreas",
    explorerUrl: "https://sepolia.basescan.org/tx/0xtreas",
    simulated: true,
  })),
}));

vi.mock("@/libs/dynamic/agent-wallet", () => ({
  isAgentWalletConfigured: vi.fn(() => false),
  getAgentWalletAddress: vi.fn(),
}));

vi.mock("@/libs/linq", () => ({
  sendChatMessage: vi.fn(),
  isLinqConfigured: vi.fn(() => false),
}));

vi.mock("@/libs/agent/status-hud", () => ({
  HUD_STAGE: { paid: "paid", funded: "funded" },
  syncJobHud: vi.fn(async (job: Job) => job),
}));

import { claimEscrowRelease, getPaymentByJobId } from "@/db/payments";
import { payoutFromTreasury } from "@/libs/dynamic/treasury";

function job(status: Job["status"]): Job {
  return {
    id: "11111111-1111-4111-8111-111111111111",
    linqChatId: "chat",
    requesterHandle: "+15555550100",
    title: "Peer job",
    status,
    tier: "peer",
    priceUsdCents: 1200,
    assigneeUserId: "22222222-2222-4222-8222-222222222222",
    createdAt: "2026-07-24T00:00:00Z",
    updatedAt: "2026-07-24T00:00:00Z",
  };
}

describe("finalizePeerPayout idempotency", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("skips on-chain payout when job already paid", async () => {
    vi.mocked(getPaymentByJobId).mockResolvedValue({
      id: "33333333-3333-4333-8333-333333333333",
      jobId: job(JOB_STATUS.paid).id,
      amountCents: 1200,
      currency: "usd",
      status: PAYMENT_STATUS.settled,
      escrowTxHash: "0xesc",
      escrowReleasedAt: "2026-07-24T01:00:00Z",
      createdAt: "t",
      updatedAt: "t",
    });

    const outcome = await finalizePeerPayout(job(JOB_STATUS.paid));
    expect(outcome.action).toBe(AGENT_ACTION.paid);
    expect(payoutFromTreasury).not.toHaveBeenCalled();
    expect(claimEscrowRelease).not.toHaveBeenCalled();
  });

  it("skips payout when another caller already claimed release", async () => {
    vi.mocked(getPaymentByJobId).mockResolvedValue({
      id: "33333333-3333-4333-8333-333333333333",
      jobId: job(JOB_STATUS.approved).id,
      amountCents: 1200,
      currency: "usd",
      status: PAYMENT_STATUS.settled,
      escrowTxHash: "0xesc",
      createdAt: "t",
      updatedAt: "t",
    });
    vi.mocked(claimEscrowRelease).mockResolvedValue(null);

    const outcome = await finalizePeerPayout(job(JOB_STATUS.approved));
    expect(outcome.action).toBe(AGENT_ACTION.paid);
    expect(payoutFromTreasury).not.toHaveBeenCalled();
  });
});
