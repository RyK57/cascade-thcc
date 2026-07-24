import { beforeEach, describe, expect, it, vi } from "vitest";
import { AGENT_ACTION, handleStopTurn } from "@/libs/agent";
import { JOB_STATUS, type Job } from "@/utils/schema/job";
import { PAYMENT_STATUS } from "@/utils/schema/payment";

vi.mock("@/db/jobs", () => ({
  updateJob: vi.fn(async (id: string, input: { status?: string }) => ({
    id,
    status: input.status,
    title: "Job",
    linqChatId: "chat",
    requesterHandle: "+1requester",
    createdAt: "t",
    updatedAt: "t",
  })),
  clearAssigneeAndReopen: vi.fn(async (id: string) => ({
    id,
    status: JOB_STATUS.funded,
    title: "Job",
    linqChatId: "chat",
    requesterHandle: "+1requester",
    createdAt: "t",
    updatedAt: "t",
  })),
}));

vi.mock("@/db/payments", () => ({
  getPaymentByJobId: vi.fn(async () => null),
  updatePaymentStatus: vi.fn(async () => ({})),
}));

vi.mock("@/db/users", () => ({
  adjustCredits: vi.fn(async () => ({})),
  getUserByIdAdmin: vi.fn(async () => null),
  upsertUserByPhone: vi.fn(async () => ({ id: "user-1", creditBalance: 0 })),
}));

vi.mock("@/libs/linq", () => ({
  sendChatMessage: vi.fn(async () => ({ message: { id: "m1" } })),
}));

const { updateJob, clearAssigneeAndReopen } = await import("@/db/jobs");
const { getPaymentByJobId, updatePaymentStatus } = await import("@/db/payments");
const { adjustCredits, getUserByIdAdmin } = await import("@/db/users");
const { sendChatMessage } = await import("@/libs/linq");

function job(overrides: Partial<Job> = {}): Job {
  return {
    id: "job-1",
    title: "Test my signup",
    status: JOB_STATUS.quoted,
    linqChatId: "chat",
    requesterHandle: "+1requester",
    priceUsdCents: 1200,
    createdAt: "t",
    updatedAt: "t",
    ...overrides,
  } as Job;
}

describe("handleStopTurn", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getPaymentByJobId).mockResolvedValue(null);
    vi.mocked(getUserByIdAdmin).mockResolvedValue(null);
  });

  it("cancels an unfunded quote without refunding anything", async () => {
    const result = await handleStopTurn({
      job: job({ status: JOB_STATUS.quoted }),
      senderHandle: "+1requester",
      isNewJob: false,
    });

    expect(result.action).toBe(AGENT_ACTION.cancelled);
    expect(result.reply).toContain("Nothing was charged");
    expect(adjustCredits).not.toHaveBeenCalled();
    expect(updateJob).toHaveBeenCalledWith("job-1", {
      status: JOB_STATUS.cancelled,
    });
  });

  it("returns held escrow to the requester's balance when funded", async () => {
    const result = await handleStopTurn({
      job: job({ status: JOB_STATUS.funded }),
      senderHandle: "+1requester",
      isNewJob: false,
    });

    expect(result.action).toBe(AGENT_ACTION.cancelled);
    expect(result.reply).toContain("$12.00");
    expect(adjustCredits).toHaveBeenCalledWith(
      expect.objectContaining({ deltaCredits: 12, reason: "job_cancelled_refund" })
    );
  });

  it("never promises a refund once the escrow release is claimed", async () => {
    vi.mocked(getPaymentByJobId).mockResolvedValue({
      id: "pay-1",
      status: PAYMENT_STATUS.settled,
      escrowReleasedAt: "2026-07-24T00:00:00Z",
    } as never);

    const result = await handleStopTurn({
      job: job({ status: JOB_STATUS.approved }),
      senderHandle: "+1requester",
      isNewJob: false,
    });

    expect(adjustCredits).not.toHaveBeenCalled();
    expect(result.reply).toContain("already settled");
    expect(updateJob).toHaveBeenCalledWith("job-1", {
      status: JOB_STATUS.cancelled,
    });
  });

  it("leaves a paid job alone", async () => {
    const result = await handleStopTurn({
      job: job({ status: JOB_STATUS.paid }),
      senderHandle: "+1requester",
      isNewJob: false,
    });

    expect(result.reply).toContain("already settled");
    expect(updateJob).not.toHaveBeenCalled();
    expect(adjustCredits).not.toHaveBeenCalled();
  });

  it("is idempotent — a second STOP does not refund twice", async () => {
    const result = await handleStopTurn({
      job: job({ status: JOB_STATUS.cancelled }),
      senderHandle: "+1requester",
      isNewJob: false,
    });

    expect(result.reply).toContain("Already stopped");
    expect(adjustCredits).not.toHaveBeenCalled();
    expect(updateJob).not.toHaveBeenCalled();
  });

  it("tells the assigned worker their job was cancelled", async () => {
    await handleStopTurn({
      job: job({ status: JOB_STATUS.claimed, claimChatId: "peer-chat" }),
      senderHandle: "+1requester",
      isNewJob: false,
    });

    expect(sendChatMessage).toHaveBeenCalledWith(
      expect.objectContaining({ chatId: "peer-chat" })
    );
  });

  it("marks the payment cancelled so it cannot settle later", async () => {
    vi.mocked(getPaymentByJobId).mockResolvedValue({
      id: "pay-1",
      status: PAYMENT_STATUS.pending,
    } as never);

    await handleStopTurn({
      job: job({ status: JOB_STATUS.quoted }),
      senderHandle: "+1requester",
      isNewJob: false,
    });

    expect(updatePaymentStatus).toHaveBeenCalledWith(
      "pay-1",
      PAYMENT_STATUS.cancelled
    );
  });

  it("says nothing is running when the job was created by this very message", async () => {
    const result = await handleStopTurn({
      job: job({ status: JOB_STATUS.intake }),
      senderHandle: "+1requester",
      isNewJob: true,
    });

    expect(result.reply).toContain("Nothing is running");
    expect(adjustCredits).not.toHaveBeenCalled();
  });

  it("reopens the job when the assigned worker backs out", async () => {
    vi.mocked(getUserByIdAdmin).mockResolvedValue({
      id: "peer-1",
      phone: "+1peer",
    } as never);

    const result = await handleStopTurn({
      job: job({
        status: JOB_STATUS.claimed,
        assigneeUserId: "peer-1",
        claimChatId: "peer-chat",
      }),
      senderHandle: "+1peer",
      isNewJob: false,
    });

    expect(clearAssigneeAndReopen).toHaveBeenCalledWith("job-1");
    expect(result.reply).toContain("back in the pool");
    // The requester's own job must not be cancelled by a worker stepping off.
    expect(updateJob).not.toHaveBeenCalled();
  });
});
