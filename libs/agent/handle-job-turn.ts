import { updateJob } from "@/db/jobs";
import { listPeers } from "@/db/users";
import { needsLocationHint, requestLocation } from "@/libs/linq/location";
import type { Job } from "@/utils/schema/job";
import { JOB_STATUS } from "@/utils/schema/job";
import { JOB_TIER, type TriageResult } from "@/utils/schema/agent";
import { answerAiTask } from "./answer-ai";
import { draftExpertJob, handleExpertTurn } from "./handle-expert-turn";
import { handlePeerTurn, quotePeerJob } from "./handle-peer-turn";
import { bestEvLine } from "./routing-ev";
import { fallbackReply, routingReply } from "./reply-templates";
import { HUD_STAGE, syncJobHud } from "./status-hud";
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

const AWAITING_CLARIFICATION = "awaiting_clarification:";

export function isAwaitingClarification(triageReason?: string): boolean {
  return Boolean(triageReason?.startsWith(AWAITING_CLARIFICATION));
}

function accumulateDescription(prior: string | undefined, latest: string): string {
  const next = latest.trim();
  const prev = prior?.trim();
  if (!prev) return next;
  if (prev === next || prev.endsWith(next)) return prev;
  return `${prev}\n\nUser: ${next}`;
}

async function startFromTriage(turn: JobTurn): Promise<JobTurnOutcome> {
  const triage = turn.triage;
  if (!triage) {
    return { action: AGENT_ACTION.fallback, reply: fallbackReply() };
  }

  const description = accumulateDescription(turn.job.description, turn.text);

  if (triage.needsClarification && triage.clarifyingQuestion) {
    await updateJob(turn.job.id, {
      title: clipTitle(triage.jobSummary),
      description,
      triageReason: `${AWAITING_CLARIFICATION}${triage.reason}`,
    });
    return {
      action: AGENT_ACTION.clarified,
      reply: triage.clarifyingQuestion,
    };
  }

  const priceUsdCents = Math.round((triage.priceEstimateUsd ?? 0) * 100);
  let job = await updateJob(turn.job.id, {
    title: clipTitle(triage.jobSummary),
    description,
    tier: triage.tier,
    triageReason: triage.reason,
    priceUsdCents,
    status: JOB_STATUS.intake,
  });

  const peers = await listPeers().catch(() => []);
  const avgTrust =
    peers.reduce((s, p) => s + p.trustScore, 0) / Math.max(1, peers.length);
  const peerCost = Math.max(5, (priceUsdCents || 1200) / 100);
  const expertCost = Math.max(peerCost * 3, 45);
  const valueUsd = Math.max(peerCost * 2, expertCost);
  const evLine = bestEvLine({
    valueUsd,
    peerCostUsd: peerCost,
    expertCostUsd: expertCost,
    avgPeerTrust: avgTrust || 70,
  });

  job = await updateJob(job.id, { evSummary: evLine });
  // Card-first: HUD carries EV/stage; chat stays short.
  const routeLine = `${routingReply(triage.tier, triage.reason)}`;

  if (triage.tier === JOB_TIER.ai) {
    const { answer } = await answerAiTask({
      title: triage.jobSummary,
      description,
      latestMessage: turn.text,
    });
    await updateJob(job.id, {
      status: JOB_STATUS.paid,
      priceUsdCents: 0,
      evSummary: evLine,
    });
    // No HUD card for AI: a free in-thread answer is the whole deliverable,
    // and a "Cascade · AI done · free" card on top of it is just noise.
    return {
      action: AGENT_ACTION.answeredAi,
      reply: answer,
    };
  }

  if (triage.tier === JOB_TIER.peer) {
    if (needsLocationHint(turn.text)) {
      try {
        await requestLocation(turn.chatId);
      } catch (error) {
        console.warn("[cascade] location request failed", error);
      }
    }
    const quoted = await quotePeerJob(job);
    return {
      ...quoted,
      reply: routeLine ? `${routeLine}\n${quoted.reply}` : quoted.reply,
    };
  }

  const drafted = await draftExpertJob(job);
  return {
    ...drafted,
    reply: routeLine ? `${routeLine}\n${drafted.reply}` : drafted.reply,
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
      statusCardIsRich: undefined,
      fundedVia: undefined,
      priceUsdCents: undefined,
      walletRefuseCount: 0,
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
