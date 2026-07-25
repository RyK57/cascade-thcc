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

vi.mock("@/db/payouts", () => ({
  createPayout: vi.fn(async (input: { txHash: string }) => ({
    id: "po_1",
    jobId: "11111111-1111-4111-8111-111111111111",
    txHash: input.txHash,
    amountUsdcCents: 1200,
    status: "broadcast",
    createdAt: "t",
  })),
  getPayoutByJobId: vi.fn(async () => null),
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
import { createPayout, getPayoutByJobId } from "@/db/payouts";
import { getUserByIdAdmin } from "@/db/users";
import {
  getAgentWalletAddress,
  isAgentWalletConfigured,
} from "@/libs/dynamic/agent-wallet";
import { payWorkerUsdc } from "@/libs/dynamic/pay-worker";
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
    vi.mocked(isAgentWalletConfigured).mockReturnValue(false);
    vi.mocked(getAgentWalletAddress).mockReturnValue(undefined);
    vi.mocked(payWorkerUsdc).mockResolvedValue({
      txHash: "0xpay",
      explorerUrl: "https://sepolia.basescan.org/tx/0xpay",
    });
    vi.mocked(getUserByIdAdmin).mockResolvedValue(null);
  });

  it("skips on-chain payout when job already paid", async () => {
    vi.mocked(getPaymentByJobId).mockResolvedValue({
      id: "33333333-3333-4333-8333-333333333333",
      jobId: job(JOB_STATUS.paid).id,
      amountCents: 1200,
      currency: "usd",
      asset: "usdc" as const,
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
    // Re-reporting a job that completed earlier is not a completion — confetti
    // here is what made the effect fire on repeat messages.
    expect(outcome.effect).toBeUndefined();
  });

  it("skips payout when another caller already claimed release", async () => {
    vi.mocked(getPaymentByJobId).mockResolvedValue({
      id: "33333333-3333-4333-8333-333333333333",
      jobId: job(JOB_STATUS.approved).id,
      amountCents: 1200,
      currency: "usd",
      asset: "usdc" as const,
      status: PAYMENT_STATUS.settled,
      escrowTxHash: "0xesc",
      createdAt: "t",
      updatedAt: "t",
    });
    vi.mocked(claimEscrowRelease).mockResolvedValue(null);

    const outcome = await finalizePeerPayout(job(JOB_STATUS.approved));
    // Losing the race must not re-broadcast, and must not claim success:
    // the winner may still be mid-release, or may have died after claiming.
    expect(payoutFromTreasury).not.toHaveBeenCalled();
    expect(outcome.action).toBe(AGENT_ACTION.errored);
    expect(outcome.effect).toBeUndefined();
  });

  it("reports in-flight, not paid, when release was claimed but no payout exists", async () => {
    vi.mocked(getPaymentByJobId).mockResolvedValue({
      id: "33333333-3333-4333-8333-333333333333",
      jobId: job(JOB_STATUS.approved).id,
      amountCents: 1200,
      currency: "usd",
      asset: "usdc" as const,
      status: PAYMENT_STATUS.settled,
      escrowTxHash: "0xesc",
      escrowReleasedAt: "2026-07-24T01:00:00Z",
      createdAt: "t",
      updatedAt: "t",
    });
    vi.mocked(getPayoutByJobId).mockResolvedValue(null);

    const outcome = await finalizePeerPayout(job(JOB_STATUS.approved));
    expect(outcome.action).toBe(AGENT_ACTION.errored);
    expect(payoutFromTreasury).not.toHaveBeenCalled();
    expect(claimEscrowRelease).not.toHaveBeenCalled();
  });

  it("completes the job when a payout exists but the status write was lost", async () => {
    vi.mocked(getPaymentByJobId).mockResolvedValue({
      id: "33333333-3333-4333-8333-333333333333",
      jobId: job(JOB_STATUS.approved).id,
      amountCents: 1200,
      currency: "usd",
      asset: "usdc" as const,
      status: PAYMENT_STATUS.settled,
      escrowTxHash: "0xesc",
      escrowReleasedAt: "2026-07-24T01:00:00Z",
      createdAt: "t",
      updatedAt: "t",
    });
    vi.mocked(getPayoutByJobId).mockResolvedValue({
      id: "44444444-4444-4444-8444-444444444444",
      jobId: job(JOB_STATUS.approved).id,
      txHash: "0xpaid",
      amountUsdcCents: 1200,
      status: "broadcast",
      createdAt: "t",
    });

    const outcome = await finalizePeerPayout(job(JOB_STATUS.approved));
    expect(outcome.action).toBe(AGENT_ACTION.paid);
    expect(outcome.reply).toContain("0xpaid");
    expect(payoutFromTreasury).not.toHaveBeenCalled();
  });

  it("refuses unguarded payout when the payment row is missing", async () => {
    vi.mocked(getPaymentByJobId).mockResolvedValue(null);

    const outcome = await finalizePeerPayout(job(JOB_STATUS.approved));
    expect(outcome.action).toBe(AGENT_ACTION.errored);
    expect(claimEscrowRelease).not.toHaveBeenCalled();
    expect(payWorkerUsdc).not.toHaveBeenCalled();
    expect(payoutFromTreasury).not.toHaveBeenCalled();
  });

  it("does not fall back to treasury after an ambiguous agent-wallet failure", async () => {
    vi.mocked(getPaymentByJobId).mockResolvedValue({
      id: "33333333-3333-4333-8333-333333333333",
      jobId: job(JOB_STATUS.approved).id,
      amountCents: 1200,
      currency: "usd",
      asset: "usdc" as const,
      status: PAYMENT_STATUS.settled,
      escrowTxHash: "0xesc",
      createdAt: "t",
      updatedAt: "t",
    });
    vi.mocked(claimEscrowRelease).mockResolvedValue({
      id: "33333333-3333-4333-8333-333333333333",
      jobId: job(JOB_STATUS.approved).id,
      amountCents: 1200,
      currency: "usd",
      asset: "usdc" as const,
      status: PAYMENT_STATUS.settled,
      escrowTxHash: "0xesc",
      escrowReleasedAt: "2026-07-24T01:00:00Z",
      createdAt: "t",
      updatedAt: "t",
    });
    vi.mocked(isAgentWalletConfigured).mockReturnValue(true);
    vi.mocked(getAgentWalletAddress).mockReturnValue(
      "0x3ab7A0d64774708478F5cD66a13078d00F493896"
    );
    vi.mocked(getUserByIdAdmin).mockResolvedValue({
      id: "22222222-2222-4222-8222-222222222222",
      phone: "+15555550199",
      role: "peer",
      walletAddress: "0x8332f7007cd6082541b9e91d02470cfd3c8de2d6",
      creditBalance: 0,
      trustScore: 50,
      createdAt: "t",
    });
    vi.mocked(payWorkerUsdc).mockRejectedValue(new Error("Request timed out"));

    const outcome = await finalizePeerPayout(job(JOB_STATUS.approved));
    expect(outcome.action).toBe(AGENT_ACTION.errored);
    expect(payWorkerUsdc).toHaveBeenCalled();
    expect(payoutFromTreasury).not.toHaveBeenCalled();
    expect(createPayout).not.toHaveBeenCalled();
  });

  it("pays from the agent wallet and records a payout ledger row", async () => {
    vi.mocked(getPaymentByJobId).mockResolvedValue({
      id: "33333333-3333-4333-8333-333333333333",
      jobId: job(JOB_STATUS.approved).id,
      amountCents: 1200,
      currency: "usd",
      asset: "usdc" as const,
      status: PAYMENT_STATUS.settled,
      escrowTxHash: "0xesc",
      createdAt: "t",
      updatedAt: "t",
    });
    vi.mocked(claimEscrowRelease).mockResolvedValue({
      id: "33333333-3333-4333-8333-333333333333",
      jobId: job(JOB_STATUS.approved).id,
      amountCents: 1200,
      currency: "usd",
      asset: "usdc" as const,
      status: PAYMENT_STATUS.settled,
      escrowTxHash: "0xesc",
      escrowReleasedAt: "2026-07-24T01:00:00Z",
      createdAt: "t",
      updatedAt: "t",
    });
    vi.mocked(isAgentWalletConfigured).mockReturnValue(true);
    vi.mocked(getAgentWalletAddress).mockReturnValue(
      "0x3ab7A0d64774708478F5cD66a13078d00F493896"
    );
    vi.mocked(getUserByIdAdmin).mockResolvedValue({
      id: "22222222-2222-4222-8222-222222222222",
      phone: "+15555550199",
      role: "peer",
      walletAddress: "0x8332f7007cd6082541b9e91d02470cfd3c8de2d6",
      creditBalance: 0,
      trustScore: 50,
      createdAt: "t",
    });
    vi.mocked(payWorkerUsdc).mockResolvedValue({
      txHash: "0xagentpay",
      explorerUrl: "https://sepolia.basescan.org/tx/0xagentpay",
    });

    const outcome = await finalizePeerPayout(job(JOB_STATUS.approved));
    expect(outcome.action).toBe(AGENT_ACTION.paid);
    expect(outcome.reply).toContain("0xagentpay");
    expect(payoutFromTreasury).not.toHaveBeenCalled();
    expect(createPayout).toHaveBeenCalledWith(
      expect.objectContaining({
        txHash: "0xagentpay",
        status: "broadcast",
      })
    );
  });
});
