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
}));

vi.mock("@/db/payments", () => ({
  createPayment: vi.fn(),
  getPaymentByJobId: vi.fn(),
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

describe("intake", () => {
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
    });

    expect(outcome.action).toBe(AGENT_ACTION.drafted);
    expect(outcome.reply).toContain("$150.00");
    expect(updateJob).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        status: JOB_STATUS.draftReady,
        teracOpportunityId: "opp_1",
        quotedTotalCents: 15000,
      })
    );
  });

  it("does not draft when Terac is unconfigured", async () => {
    vi.mocked(isTeracConfigured).mockReturnValue(false);

    const outcome = await handleJobTurn({
      job: makeJob(),
      intent: AGENT_INTENT.freeform,
      text: "anything",
      isNewJob: true,
    });

    expect(outcome.action).toBe(AGENT_ACTION.draftPending);
    expect(createDraftOpportunity).not.toHaveBeenCalled();
  });
});

describe("draft_ready", () => {
  const draftJob = makeJob({
    status: JOB_STATUS.draftReady,
    teracOpportunityId: "opp_1",
    quotedTotalCents: 15000,
    quotedCurrency: "usd",
  });

  it("launches only on affirm", async () => {
    vi.mocked(launchOpportunity).mockResolvedValue({
      id: "opp_1",
      title: "t",
      status: "live",
      num_participants: 1,
    });

    const outcome = await handleJobTurn({
      job: draftJob,
      intent: AGENT_INTENT.affirm,
      text: "yes",
      isNewJob: false,
    });

    expect(outcome.action).toBe(AGENT_ACTION.launched);
    expect(launchOpportunity).toHaveBeenCalledWith("opp_1");
    expect(updateJob).toHaveBeenCalledWith(
      draftJob.id,
      expect.objectContaining({ status: JOB_STATUS.launched })
    );
  });

  it("keeps the draft on decline without launching", async () => {
    const outcome = await handleJobTurn({
      job: draftJob,
      intent: AGENT_INTENT.decline,
      text: "no",
      isNewJob: false,
    });

    expect(outcome.action).toBe(AGENT_ACTION.keptDraft);
    expect(launchOpportunity).not.toHaveBeenCalled();
  });
});

describe("review", () => {
  const launchedJob = makeJob({
    status: JOB_STATUS.launched,
    teracOpportunityId: "opp_1",
    quotedTotalCents: 15000,
    quotedCurrency: "usd",
  });

  it("approves awaiting work and opens a payment", async () => {
    vi.mocked(listSubmissions).mockResolvedValue({
      data: [
        {
          id: "sub_1",
          opportunity_id: "opp_1",
          status: "awaiting_review",
          participant_id: "p_1",
          created_at: "",
          updated_at: "",
        },
      ],
      pagination: { has_more: false },
    });

    const outcome = await handleJobTurn({
      job: launchedJob,
      intent: AGENT_INTENT.affirm,
      text: "yes",
      isNewJob: false,
    });

    expect(outcome.action).toBe(AGENT_ACTION.approvedWork);
    expect(reviewSubmission).toHaveBeenCalledWith({
      submissionId: "sub_1",
      decision: "approve",
    });
    expect(createPayment).toHaveBeenCalledWith(
      expect.objectContaining({ amountCents: 15000, teracSubmissionId: "sub_1" })
    );
    expect(updateJob).toHaveBeenCalledWith(
      launchedJob.id,
      expect.objectContaining({ status: JOB_STATUS.paymentPending })
    );
  });

  it("reports search status when nothing needs review", async () => {
    vi.mocked(listSubmissions).mockResolvedValue({
      data: [],
      pagination: { has_more: false },
    });
    vi.mocked(getOpportunity).mockResolvedValue({
      id: "opp_1",
      title: "t",
      status: "live",
      num_participants: 1,
      submission_stats: {
        total: 2,
        in_progress: 2,
        awaiting_review: 0,
        approved: 0,
        rejected: 0,
      },
    });

    const outcome = await handleJobTurn({
      job: launchedJob,
      intent: AGENT_INTENT.status,
      text: "status?",
      isNewJob: false,
    });

    expect(outcome.action).toBe(AGENT_ACTION.statusReported);
    expect(outcome.reply).toContain("2 in progress");
  });
});

describe("payment_pending", () => {
  it("closes the job once the payment settles", async () => {
    vi.mocked(getPaymentByJobId).mockResolvedValue({
      id: "22222222-2222-4222-8222-222222222222",
      jobId: "11111111-1111-4111-8111-111111111111",
      amountCents: 15000,
      currency: "usd",
      status: PAYMENT_STATUS.settled,
      createdAt: "",
      updatedAt: "",
    });

    const outcome = await handleJobTurn({
      job: makeJob({ status: JOB_STATUS.paymentPending }),
      intent: AGENT_INTENT.status,
      text: "status",
      isNewJob: false,
    });

    expect(outcome.action).toBe(AGENT_ACTION.paid);
    expect(updateJob).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({ status: JOB_STATUS.paid })
    );
  });
});
