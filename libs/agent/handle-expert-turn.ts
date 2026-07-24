import { createPayment, getPaymentByJobId } from "@/db/payments";
import { updateJob } from "@/db/jobs";
import { explorerTxUrl } from "@/libs/dynamic/sandbox";
import {
  createDraftOpportunity,
  expertFiltersForJob,
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
import { HUD_STAGE, syncJobHud } from "./status-hud";
import { AGENT_ACTION, AGENT_INTENT, type AgentAction, type AgentIntent } from "./types";

const DEFAULT_NUM_PARTICIPANTS = 1;

interface ExpertTurn {
  job: Job;
  intent: AgentIntent;
  text: string;
  isNewJob: boolean;
}

interface ExpertOutcome {
  action: AgentAction;
  reply: string;
  effect?: "confetti";
}

export async function draftExpertJob(job: Job): Promise<ExpertOutcome> {
  const projectId = getTeracProjectId();
  if (!isTeracConfigured() || !projectId) {
    return {
      action: AGENT_ACTION.draftPending,
      reply: teracUnavailableReply(job.title),
    };
  }

  const filters = expertFiltersForJob(job.title, job.description);

  const opportunity = await createDraftOpportunity({
    title: job.title,
    description: job.description
      ? `${job.description}\n\nScreening: ${filters.screeningHint}`
      : filters.screeningHint,
    projectId,
    numParticipants: DEFAULT_NUM_PARTICIPANTS,
    businessType: "b2c",
    internalTitle: `cascade-job-${job.id}`,
    screeningQuestions: [
      {
        key: "seniority",
        text: `Are you a ${filters.roleLabel}?`,
        pick: "one",
        answers: [
          { text: "Yes", qualify_logic: "qualify" },
          { text: "No", qualify_logic: "disqualify" },
        ],
      },
    ],
  });

  let updated = await updateJob(job.id, {
    status: JOB_STATUS.quoted,
    teracOpportunityId: opportunity.id,
    quotedTotalCents: opportunity.pricing?.total_cost_cents,
    quotedCurrency: opportunity.pricing?.currency,
    priceUsdCents: opportunity.pricing?.total_cost_cents,
  });
  updated = await syncJobHud(updated, HUD_STAGE.quoted);

  return {
    action: AGENT_ACTION.quoted,
    reply: draftReadyReply({
      title: updated.title,
      numParticipants: DEFAULT_NUM_PARTICIPANTS,
      totalCents: opportunity.pricing?.total_cost_cents,
      currency: opportunity.pricing?.currency,
      roleLabel: filters.roleLabel,
    }),
  };
}

export async function handleExpertTurn(turn: ExpertTurn): Promise<ExpertOutcome> {
  const status =
    turn.job.status === JOB_STATUS.draftReady
      ? JOB_STATUS.quoted
      : turn.job.status;

  switch (status) {
    case JOB_STATUS.quoted:
      return handleQuoted(turn);
    case JOB_STATUS.launched:
    case JOB_STATUS.inReview:
      return handleReview(turn);
    case JOB_STATUS.paymentPending:
      return handlePaymentPending(turn);
    default:
      return { action: AGENT_ACTION.fallback, reply: fallbackReply() };
  }
}

async function handleQuoted(turn: ExpertTurn): Promise<ExpertOutcome> {
  const { job, intent, text } = turn;
  if (!job.teracOpportunityId) return draftExpertJob(job);

  if (intent === AGENT_INTENT.affirm) {
    await launchOpportunity(job.teracOpportunityId);
    let launched = await updateJob(job.id, { status: JOB_STATUS.launched });
    launched = await syncJobHud(launched, HUD_STAGE.launched);
    return { action: AGENT_ACTION.launched, reply: launchedReply(launched.title) };
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

  const filters = expertFiltersForJob(job.title, job.description);
  return {
    action: AGENT_ACTION.statusReported,
    reply: draftReadyReply({
      title: job.title,
      numParticipants: DEFAULT_NUM_PARTICIPANTS,
      totalCents: job.quotedTotalCents,
      currency: job.quotedCurrency,
      roleLabel: filters.roleLabel,
    }),
  };
}

async function handleReview({ job, intent }: ExpertTurn): Promise<ExpertOutcome> {
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
      await reviewSubmission({
        submissionId: submission.id,
        decision: "approve",
      });
    }

    let amountCents = job.quotedTotalCents ?? job.priceUsdCents;
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

    let pending = await updateJob(job.id, {
      status: JOB_STATUS.paymentPending,
      teracSubmissionId: submission.id,
    });
    pending = await syncJobHud(pending, HUD_STAGE.paymentPending);

    return {
      action: AGENT_ACTION.approvedWork,
      reply: approvedWorkReply(
        getPayUrl(pending.id),
        amountCents ? formatCents(amountCents, job.quotedCurrency) : undefined
      ),
    };
  }

  if (intent === AGENT_INTENT.decline && awaiting.length) {
    await reviewSubmission({
      submissionId: awaiting[0].id,
      decision: "reject",
    });
    await updateJob(job.id, { status: JOB_STATUS.launched });
    return { action: AGENT_ACTION.rejectedWork, reply: rejectedWorkReply() };
  }

  if (awaiting.length) {
    let reviewing = job;
    if (job.status !== JOB_STATUS.inReview) {
      reviewing = await updateJob(job.id, { status: JOB_STATUS.inReview });
    }
    reviewing = await syncJobHud(reviewing, HUD_STAGE.inReview);
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

async function handlePaymentPending({ job }: ExpertTurn): Promise<ExpertOutcome> {
  const payment = await getPaymentByJobId(job.id);

  if (payment?.status === PAYMENT_STATUS.settled) {
    let paid = await updateJob(job.id, { status: JOB_STATUS.paid });
    paid = await syncJobHud(paid, HUD_STAGE.paid);
    const explorer = payment.escrowTxHash
      ? explorerTxUrl(payment.escrowTxHash)
      : undefined;
    return {
      action: AGENT_ACTION.paid,
      reply: paidReply(explorer),
      effect: "confetti",
    };
  }

  return {
    action: AGENT_ACTION.paymentPending,
    reply: paymentPendingReply(getPayUrl(job.id)),
  };
}

/** Called by cron when submissions appear. */
export async function pollExpertSubmissions(job: Job): Promise<{
  notified: boolean;
  reply?: string;
}> {
  if (!job.teracOpportunityId) return { notified: false };
  if (
    job.status !== JOB_STATUS.launched &&
    job.status !== JOB_STATUS.inReview
  ) {
    return { notified: false };
  }

  const { data: submissions } = await listSubmissions({
    opportunityId: job.teracOpportunityId,
  });
  const awaiting = submissions.filter(
    (s) => s.status === TERAC_SUBMISSION_STATUS.awaitingReview
  );
  if (!awaiting.length) return { notified: false };

  if (job.status !== JOB_STATUS.inReview) {
    const reviewing = await updateJob(job.id, {
      status: JOB_STATUS.inReview,
      teracSubmissionId: awaiting[0].id,
    });
    await syncJobHud(reviewing, HUD_STAGE.inReview);
  }

  return { notified: true, reply: workReadyReply(awaiting.length) };
}
