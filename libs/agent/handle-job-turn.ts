import { updateJob } from "@/db/jobs";
import { listPeers } from "@/db/users";
import { needsLocationHint, requestLocation } from "@/libs/linq/location";
import type { Job } from "@/utils/schema/job";
import { JOB_STATUS } from "@/utils/schema/job";
import { JOB_TIER, type TriageResult } from "@/utils/schema/agent";
import { answerAiTask } from "./answer-ai";
import type { ConversationTurn } from "./conversation";
import { draftExpertJob, handleExpertTurn } from "./handle-expert-turn";
import { handlePeerTurn, quotePeerJob } from "./handle-peer-turn";
import { interpretPayAsset } from "./interpret-message";
import { bestEvLine } from "./routing-ev";
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
  /** Earlier turns on this thread, oldest first. Excludes `text`. */
  history?: ConversationTurn[];
  /** Approximate texter location for this turn, when known. */
  locationContext?: string;
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

/** Keeps the original request alongside any clarifying answer. */
function accumulateDescription(prior: string | undefined, latest: string): string {
  const next = latest.trim();
  const prev = prior?.trim();
  if (!prev) return next;
  if (prev === next || prev.includes(next) || prev.endsWith(next)) return prev;
  return `${prev}\n\nUser: ${next}`;
}

async function startFromTriage(turn: JobTurn): Promise<JobTurnOutcome> {
  const triage = turn.triage;
  if (!triage) {
    return { action: AGENT_ACTION.fallback, reply: fallbackReply() };
  }

  const description = accumulateDescription(turn.job.description, turn.text);

  if (triage.needsClarification && triage.clarifyingQuestion) {
    // Merge, don't overwrite: a second clarifying round used to drop the
    // original request, leaving the brief as just the last answer given.
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

  // `?? 0` let a missing or zero estimate through, and every downstream
  // fallback uses `??`, which does not catch 0 — createPayment then rejected
  // amountCents: 0 and the job wedged in intake, re-failing on every message.
  const estimateUsd = triage.priceEstimateUsd || 0;
  const priceUsdCents =
    triage.tier === JOB_TIER.ai
      ? Math.max(0, Math.round(estimateUsd * 100))
      : Math.max(1, Math.round((estimateUsd || 12) * 100));

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
  const routeLine = routingReply(triage.tier, triage.reason);

  if (triage.tier === JOB_TIER.ai) {
    const { answer } = await answerAiTask({
      title: triage.jobSummary,
      description,
      latestMessage: turn.text,
      history: turn.history,
      locationContext: turn.locationContext,
    });
    await updateJob(job.id, {
      status: JOB_STATUS.paid,
      priceUsdCents: 0,
      evSummary: evLine,
    });
    // No HUD card for AI: a free in-thread answer is the whole deliverable.
    // No confetti either — reserved for a job that finishes real work.
    return {
      action: AGENT_ACTION.answeredAi,
      reply: answer,
    };
  }

  if (triage.tier === JOB_TIER.peer) {
    // Ask for a share when the brief is local and we still have no coords —
    // peer ranking uses requesterLat/Lng when present.
    if (needsLocationHint(turn.text) && !turn.locationContext) {
      try {
        await requestLocation(turn.chatId);
      } catch (error) {
        console.warn("[cascade] location request failed", error);
      }
    }
    const quoted = await quotePeerJob(job, interpretPayAsset(turn.text) ?? undefined);
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
    // Explicit nulls, not undefined: updateJob drops undefined keys so the
    // PATCH can stay partial. Leaving assignee_user_id or claim_chat_id behind
    // makes the next job in this thread permanently unclaimable.
    const reset = await updateJob(job.id, {
      status: JOB_STATUS.intake,
      title: clipTitle(text),
      description: text,
      tier: null,
      teracOpportunityId: null,
      teracSubmissionId: null,
      teracTaskUrl: null,
      quotedTotalCents: null,
      quotedCurrency: null,
      assigneeUserId: null,
      claimChatId: null,
      statusCardMessageId: null,
      statusCardIsRich: false,
      fundedVia: null,
      priceUsdCents: null,
      evSummary: null,
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
