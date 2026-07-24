import { beforeEach, describe, expect, it, vi } from "vitest";
import { AGENT_ACTION, AGENT_INTENT, handleJobTurn } from "@/libs/agent";
import { JOB_STATUS, type Job } from "@/utils/schema/job";
import { PAYMENT_STATUS } from "@/utils/schema/payment";
import { updateJob } from "@/db/jobs";
import { createPayment, getPaymentByJobId } from "@/db/payments";
import {
  createDraftOpportunity,
  getOpportunity,
  getTeracProjectId,
  isTeracConfigured,
  launchOpportunity,
  listSubmissions,
  reviewSubmission,
} from "@/libs/terac";

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
  adjustCredits: vi.fn(),
  getUserByIdAdmin: vi.fn(),
  getUserByPhone: vi.fn(),
  upsertUserByPhone: vi.fn(),
  listPeers: vi.fn(async () => []),
}));

vi.mock("@/libs/linq", () => ({
  sendChatMessage: vi.fn(),
  sendTextMessage: vi.fn(),
  isLinqConfigured: vi.fn(() => false),
}));

vi.mock("@/libs/dynamic/treasury", () => ({
  payoutFromTreasury: vi.fn(),
  ensureSandboxTreasury: vi.fn(),
}));

vi.mock("@/libs/terac", () => ({
  createDraftOpportunity: vi.fn(),
  getOpportunity: vi.fn(),
  getTeracProjectId: vi.fn(),
  isTeracConfigured: vi.fn(),
  launchOpportunity: vi.fn(),
  listSubmissions: vi.fn(),
  reviewSubmission: vi.fn(),
  updateOpportunity: vi.fn(),
  TERAC_SUBMISSION_STATUS: {
    inProgress: "in_progress",
    awaitingReview: "awaiting_review",
    approved: "approved",
    rejected: "rejected",
  },
}));

vi.mock("@/libs/agent/answer-ai", () => ({
  answerAiTask: vi.fn(async () => ({
    answer: "Here is your plan.",
    followUp: "Want a peer test?",
  })),
}));

function makeJob(overrides: Partial<Job> = {}): Job {
  return {
    id: "11111111-1111-4111-8111-111111111111",
    linqChatId: "chat_1",
    requesterHandle: "+15555550123",
    title: "Find a pitch deck reviewer",
    description: "Need a VC-experienced reviewer",
    status: JOB_STATUS.intake,
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
  vi.mocked(isTeracConfigured).mockReturnValue(true);
  vi.mocked(getTeracProjectId).mockReturnValue("proj_1");
});

describe("expert triage intake", () => {
  it("drafts a Terac opportunity and quotes the cost", async () => {
    vi.mocked(createDraftOpportunity).mockResolvedValue({
      id: "opp_1",
      title: "Find a pitch deck reviewer",
      status: "draft",
      num_participants: 1,
      pricing: {
        cost_per_participant_cents: 15000,
        total_cost_cents: 15000,
        currency: "usd",
      },
    });

    const outcome = await handleJobTurn({
      job: makeJob(),
      intent: AGENT_INTENT.freeform,
      text: "Need a VC-experienced reviewer",
      isNewJob: true,
      senderHandle: "+15555550123",
      chatId: "chat_1",
      triage: {
        tier: "expert",
        jobSummary: "Find a pitch deck reviewer",
        reason: "needs a verified specialist",
        needsClarification: false,
        priceEstimateUsd: 150,
      },
    });

    expect(createDraftOpportunity).toHaveBeenCalled();
    expect(outcome.action).toBe(AGENT_ACTION.quoted);
    expect(outcome.reply.toLowerCase()).toContain("expert");
  });
});

describe("ai triage", () => {
  it("answers in-thread for free", async () => {
    const outcome = await handleJobTurn({
      job: makeJob({ title: "Plan my week" }),
      intent: AGENT_INTENT.freeform,
      text: "plan my week around Startup School",
      isNewJob: true,
      senderHandle: "+15555550123",
      chatId: "chat_1",
      triage: {
        tier: "ai",
        jobSummary: "Plan my week around Startup School",
        reason: "Cascade can answer this",
        needsClarification: false,
        priceEstimateUsd: 0,
      },
    });

    expect(outcome.action).toBe(AGENT_ACTION.answeredAi);
    expect(outcome.reply).toContain("Cascade → ai");
  });
});

describe("expert quoted", () => {
  it("launches on affirm", async () => {
    vi.mocked(launchOpportunity).mockResolvedValue({
      id: "opp_1",
      title: "x",
      status: "live",
      num_participants: 1,
    });

    const outcome = await handleJobTurn({
      job: makeJob({
        status: JOB_STATUS.quoted,
        tier: "expert",
        teracOpportunityId: "opp_1",
      }),
      intent: AGENT_INTENT.affirm,
      text: "yes",
      isNewJob: false,
      senderHandle: "+15555550123",
      chatId: "chat_1",
    });

    expect(launchOpportunity).toHaveBeenCalledWith("opp_1");
    expect(outcome.action).toBe(AGENT_ACTION.launched);
  });
});

describe("expert review", () => {
  it("approves work and queues sandbox payment", async () => {
    vi.mocked(listSubmissions).mockResolvedValue({
      data: [
        {
          id: "sub_1",
          opportunity_id: "opp_1",
          status: "awaiting_review",
        },
      ],
    } as never);
    vi.mocked(reviewSubmission).mockResolvedValue({
      id: "sub_1",
      opportunity_id: "opp_1",
      participant_id: "p1",
      status: "approved",
      created_at: "2026-07-24T00:00:00.000Z",
      updated_at: "2026-07-24T00:00:00.000Z",
    });
    vi.mocked(createPayment).mockResolvedValue({
      id: "pay_1",
      jobId: "11111111-1111-4111-8111-111111111111",
      amountCents: 15000,
      currency: "usd",
      status: PAYMENT_STATUS.pending,
      createdAt: "2026-07-24T00:00:00.000Z",
      updatedAt: "2026-07-24T00:00:00.000Z",
    });

    const outcome = await handleJobTurn({
      job: makeJob({
        status: JOB_STATUS.inReview,
        tier: "expert",
        teracOpportunityId: "opp_1",
        quotedTotalCents: 15000,
      }),
      intent: AGENT_INTENT.affirm,
      text: "yes",
      isNewJob: false,
      senderHandle: "+15555550123",
      chatId: "chat_1",
    });

    expect(outcome.action).toBe(AGENT_ACTION.approvedWork);
    expect(createPayment).toHaveBeenCalled();
  });
});

describe("expert payment pending", () => {
  it("reports paid when settlement already landed", async () => {
    vi.mocked(getPaymentByJobId).mockResolvedValue({
      id: "pay_1",
      jobId: "11111111-1111-4111-8111-111111111111",
      amountCents: 15000,
      currency: "usd",
      status: PAYMENT_STATUS.settled,
      createdAt: "2026-07-24T00:00:00.000Z",
      updatedAt: "2026-07-24T00:00:00.000Z",
    });

    const outcome = await handleJobTurn({
      job: makeJob({
        status: JOB_STATUS.paymentPending,
        tier: "expert",
        teracOpportunityId: "opp_1",
      }),
      intent: AGENT_INTENT.status,
      text: "status",
      isNewJob: false,
      senderHandle: "+15555550123",
      chatId: "chat_1",
    });

    expect(outcome.action).toBe(AGENT_ACTION.paid);
  });
});

// silence unused import warning in some tooling
void getOpportunity;
