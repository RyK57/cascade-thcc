import { createPayment, getPaymentByJobId } from "@/db/payments";
import { updateJob } from "@/db/jobs";
import {
  createDraftOpportunity,
  getOpportunity,
  getTeracProjectId,
  isTeracConfigured,
  launchOpportunity,
  listSubmissions,
  reviewSubmission,
  TERAC_SUBMISSION_STATUS,
  updateOpportunity,
} from "@/libs/terac";
import type { Job } from "@/utils/schema/job";
import { JOB_STATUS } from "@/utils/schema/job";
import { PAYMENT_STATUS } from "@/utils/schema/payment";
import { getPayUrl } from "./pay-url";
import {
  approvedWorkReply,
  draftReadyReply,
  fallbackReply,
  formatCents,
  keptDraftReply,
  launchedReply,
  paidReply,
  paymentPendingReply,
  refinedReply,
  rejectedWorkReply,
  searchStatusReply,
  teracUnavailableReply,
  workReadyReply,
} from "./reply-templates";
import { AGENT_ACTION, AGENT_INTENT, type AgentAction, type AgentIntent } from "./types";

const DEFAULT_NUM_PARTICIPANTS = 1;

interface JobTurn {
  job: Job;
  intent: AgentIntent;
  text: string;
  isNewJob: boolean;
}

interface JobTurnOutcome {
  action: AgentAction;
  reply: string;
}

export function clipTitle(text: string): string {
  const firstLine = text.split("\n")[0].trim();
  return firstLine.length > 80 ? `${firstLine.slice(0, 77)}...` : firstLine;
}

export async function handleJobTurn(turn: JobTurn): Promise<JobTurnOutcome> {
  switch (turn.job.status) {
    case JOB_STATUS.intake:
      return handleIntake(turn);
    case JOB_STATUS.draftReady:
      return handleDraftReady(turn);
    case JOB_STATUS.launched:
    case JOB_STATUS.inReview:
      return handleReview(turn);
    case JOB_STATUS.paymentPending:
      return handlePaymentPending(turn);
    case JOB_STATUS.paid:
    case JOB_STATUS.cancelled:
      return handleClosed(turn);
  }
}

async function handleIntake({ job, text, isNewJob }: JobTurn): Promise<JobTurnOutcome> {
  let current = job;
  if (!isNewJob) {
    current = await updateJob(job.id, {
      description: job.description ? `${job.description}\n${text}` : text,
    });
  }

  const projectId = getTeracProjectId();
  if (!isTeracConfigured() || !projectId) {
    return {
      action: AGENT_ACTION.draftPending,
      reply: teracUnavailableReply(current.title),
    };
  }

  const opportunity = await createDraftOpportunity({
    title: current.title,
    description: current.description,
    projectId,
    numParticipants: DEFAULT_NUM_PARTICIPANTS,
    businessType: "b2c",
    internalTitle: `linq-job-${current.id}`,
  });

  await updateJob(current.id, {
    status: JOB_STATUS.draftReady,
    teracOpportunityId: opportunity.id,
    quotedTotalCents: opportunity.pricing?.total_cost_cents,
    quotedCurrency: opportunity.pricing?.currency,
  });

  return {
    action: AGENT_ACTION.drafted,
    reply: draftReadyReply({
      title: current.title,
      numParticipants: DEFAULT_NUM_PARTICIPANTS,
      totalCents: opportunity.pricing?.total_cost_cents,
      currency: opportunity.pricing?.currency,
    }),
  };
}

async function handleDraftReady(turn: JobTurn): Promise<JobTurnOutcome> {
  const { job, intent, text } = turn;
  if (!job.teracOpportunityId) return handleIntake(turn);

  if (intent === AGENT_INTENT.affirm) {
    await launchOpportunity(job.teracOpportunityId);
    await updateJob(job.id, { status: JOB_STATUS.launched });
    return { action: AGENT_ACTION.launched, reply: launchedReply(job.title) };
  }

  if (intent === AGENT_INTENT.decline) {
    return { action: AGENT_ACTION.keptDraft, reply: keptDraftReply() };
  }

  if (intent === AGENT_INTENT.freeform) {
    const description = job.description ? `${job.description}\n${text}` : text;
    await updateJob(job.id, { description });
    await updateOpportunity(job.teracOpportunityId, { description });
    return { action: AGENT_ACTION.refined, reply: refinedReply() };
  }

  return {
    action: AGENT_ACTION.statusReported,
    reply: draftReadyReply({
      title: job.title,
      numParticipants: DEFAULT_NUM_PARTICIPANTS,
      totalCents: job.quotedTotalCents,
      currency: job.quotedCurrency,
    }),
  };
}

async function handleReview({ job, intent }: JobTurn): Promise<JobTurnOutcome> {
  if (!job.teracOpportunityId) {
    return { action: AGENT_ACTION.fallback, reply: fallbackReply() };
  }

  const { data: submissions } = await listSubmissions({
    opportunityId: job.teracOpportunityId,
  });
  const awaiting = submissions.filter(
    (s) => s.status === TERAC_SUBMISSION_STATUS.awaitingReview
  );
  const approved = submissions.filter(
    (s) => s.status === TERAC_SUBMISSION_STATUS.approved
  );

  if (intent === AGENT_INTENT.affirm && (awaiting.length || approved.length)) {
    const submission = awaiting[0] ?? approved[0];
    if (awaiting[0]) {
      await reviewSubmission({ submissionId: submission.id, decision: "approve" });
    }

    let amountCents = job.quotedTotalCents;
    if (amountCents === undefined) {
      const opportunity = await getOpportunity(job.teracOpportunityId);
      amountCents = opportunity.pricing?.total_cost_cents;
    }
    if (amountCents) {
      await createPayment({
        jobId: job.id,
        teracSubmissionId: submission.id,
        amountCents,
        currency: job.quotedCurrency ?? "usd",
      });
    }

    await updateJob(job.id, {
      status: JOB_STATUS.paymentPending,
      teracSubmissionId: submission.id,
    });

    return {
      action: AGENT_ACTION.approvedWork,
      reply: approvedWorkReply(
        getPayUrl(job.id),
        amountCents ? formatCents(amountCents, job.quotedCurrency) : undefined
      ),
    };
  }

  if (intent === AGENT_INTENT.decline && awaiting.length) {
    await reviewSubmission({ submissionId: awaiting[0].id, decision: "reject" });
    await updateJob(job.id, { status: JOB_STATUS.launched });
    return { action: AGENT_ACTION.rejectedWork, reply: rejectedWorkReply() };
  }

  if (awaiting.length) {
    if (job.status !== JOB_STATUS.inReview) {
      await updateJob(job.id, { status: JOB_STATUS.inReview });
    }
    return {
      action: AGENT_ACTION.workReady,
      reply: workReadyReply(awaiting.length),
    };
  }

  const opportunity = await getOpportunity(job.teracOpportunityId);
  return {
    action: AGENT_ACTION.statusReported,
    reply: searchStatusReply(opportunity.submission_stats),
  };
}

async function handlePaymentPending({ job }: JobTurn): Promise<JobTurnOutcome> {
  const payment = await getPaymentByJobId(job.id);

  if (payment?.status === PAYMENT_STATUS.settled) {
    await updateJob(job.id, { status: JOB_STATUS.paid });
    return { action: AGENT_ACTION.paid, reply: paidReply() };
  }

  return {
    action: AGENT_ACTION.paymentPending,
    reply: paymentPendingReply(getPayUrl(job.id)),
  };
}

async function handleClosed(turn: JobTurn): Promise<JobTurnOutcome> {
  const { job, intent, text } = turn;

  if (intent === AGENT_INTENT.freeform) {
    const reset = await updateJob(job.id, {
      status: JOB_STATUS.intake,
      title: clipTitle(text),
      description: text,
    });
    return handleIntake({ ...turn, job: reset, isNewJob: true });
  }

  return { action: AGENT_ACTION.fallback, reply: fallbackReply() };
}
