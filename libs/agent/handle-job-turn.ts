import { updateJob } from "@/db/jobs";
import type { Job } from "@/utils/schema/job";
import { JOB_STATUS } from "@/utils/schema/job";
import { JOB_TIER, type TriageResult } from "@/utils/schema/agent";
import { answerAiTask } from "./answer-ai";
import { draftExpertJob, handleExpertTurn } from "./handle-expert-turn";
import { handlePeerTurn, quotePeerJob } from "./handle-peer-turn";
import { fallbackReply, routingReply } from "./reply-templates";
import { AGENT_ACTION, AGENT_INTENT, type AgentAction, type AgentIntent } from "./types";

export interface JobTurn {
  job: Job;
  intent: AgentIntent;
  text: string;
  isNewJob: boolean;
  senderHandle: string;
  chatId: string;
  /** Set when this turn starts with a fresh triage. */
  triage?: TriageResult;
}

export interface JobTurnOutcome {
  action: AgentAction;
  reply: string;
  effect?: "confetti";
}

export function clipTitle(text: string): string {
  const firstLine = text.split("\n")[0].trim();
  return firstLine.length > 80 ? `${firstLine.slice(0, 77)}...` : firstLine;
}

export async function handleJobTurn(turn: JobTurn): Promise<JobTurnOutcome> {
  const { job, triage } = turn;

  if (
    job.status === JOB_STATUS.paid ||
    job.status === JOB_STATUS.cancelled
  ) {
    return handleClosed(turn);
  }

  // Fresh intake / re-triage
  if (job.status === JOB_STATUS.intake || triage) {
    return startFromTriage(turn);
  }

  const tier = job.tier;
  if (tier === JOB_TIER.ai) {
    return {
      action: AGENT_ACTION.fallback,
      reply: fallbackReply(),
    };
  }
  if (tier === JOB_TIER.peer) {
    return handlePeerTurn(turn);
  }
  if (tier === JOB_TIER.expert) {
    return handleExpertTurn(turn);
  }

  // Legacy jobs without tier → treat as expert
  return handleExpertTurn(turn);
}

async function startFromTriage(turn: JobTurn): Promise<JobTurnOutcome> {
  const triage = turn.triage;
  if (!triage) {
    return { action: AGENT_ACTION.fallback, reply: fallbackReply() };
  }

  if (triage.needsClarification && triage.clarifyingQuestion) {
    await updateJob(turn.job.id, {
      title: clipTitle(triage.jobSummary),
      description: turn.text,
      triageReason: triage.reason,
    });
    return {
      action: AGENT_ACTION.clarified,
      reply: triage.clarifyingQuestion,
    };
  }

  const priceUsdCents = Math.round((triage.priceEstimateUsd ?? 0) * 100);
  const job = await updateJob(turn.job.id, {
    title: clipTitle(triage.jobSummary),
    description: turn.job.description ?? turn.text,
    tier: triage.tier,
    triageReason: triage.reason,
    priceUsdCents,
    status: JOB_STATUS.intake,
  });

  const routeLine = routingReply(triage.tier, triage.reason);

  if (triage.tier === JOB_TIER.ai) {
    const { answer } = await answerAiTask({
      title: job.title,
      description: job.description ?? turn.text,
    });
    await updateJob(job.id, { status: JOB_STATUS.paid, priceUsdCents: 0 });
    return {
      action: AGENT_ACTION.answeredAi,
      reply: `${routeLine}\n\n${answer}`,
      effect: "confetti",
    };
  }

  if (triage.tier === JOB_TIER.peer) {
    const quoted = await quotePeerJob(job);
    return {
      ...quoted,
      reply: `${routeLine}\n\n${quoted.reply}`,
    };
  }

  const drafted = await draftExpertJob(job);
  return {
    ...drafted,
    reply: `${routeLine}\n\n${drafted.reply}`,
  };
}

async function handleClosed(turn: JobTurn): Promise<JobTurnOutcome> {
  const { job, intent, text } = turn;

  if (intent === AGENT_INTENT.freeform) {
    const reset = await updateJob(job.id, {
      status: JOB_STATUS.intake,
      title: clipTitle(text),
      description: text,
      tier: undefined,
      teracOpportunityId: undefined,
      teracSubmissionId: undefined,
      assigneeUserId: undefined,
      claimChatId: undefined,
      statusCardMessageId: undefined,
      fundedVia: undefined,
      priceUsdCents: undefined,
    });
    return handleJobTurn({
      ...turn,
      job: reset,
      isNewJob: true,
      triage: turn.triage,
    });
  }

  return { action: AGENT_ACTION.fallback, reply: fallbackReply() };
}
