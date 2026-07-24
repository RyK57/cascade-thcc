import { updateJob } from "@/db/jobs";
import { listPeers } from "@/db/users";
import { needsLocationHint, requestLocation } from "@/libs/linq/location";
import type { Job } from "@/utils/schema/job";
import { JOB_STATUS } from "@/utils/schema/job";
import { JOB_TIER, type TriageResult } from "@/utils/schema/agent";
import { answerAiTask } from "./answer-ai";
import { draftExpertJob, handleExpertTurn } from "./handle-expert-turn";
import { handlePeerTurn, quotePeerJob } from "./handle-peer-turn";
import { interpretPayAsset } from "./interpret-message";
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

/** Keeps the original request alongside any clarifying answer. */
function mergeBrief(existing: string | undefined, latest: string): string {
  if (!existing) return latest;
  if (existing === latest || existing.includes(latest)) return existing;
  return `${existing}\n${latest}`;
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
    // Append, don't coalesce: createJob always sets description, so `??` never
    // fell through and the answer to a clarifying question was never stored.
    description: mergeBrief(turn.job.description, turn.text),
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
      title: job.title,
      description: job.description ?? turn.text,
    });
    const done = await updateJob(job.id, {
      status: JOB_STATUS.paid,
      priceUsdCents: 0,
      evSummary: evLine,
    });
    await syncJobHud(done, HUD_STAGE.answered);
    return {
      action: AGENT_ACTION.answeredAi,
      reply: `${routeLine}\n\n${answer}`,
      effect: "confetti",
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
    const quoted = await quotePeerJob(job, interpretPayAsset(turn.text) ?? undefined);
    return {
      ...quoted,
      reply: `${routeLine}\n❤️ approve after funding · 👎 reject`,
    };
  }

  const drafted = await draftExpertJob(job);
  return {
    ...drafted,
    reply: `${routeLine}\n❤️ launch Terac · 👎 revise`,
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
