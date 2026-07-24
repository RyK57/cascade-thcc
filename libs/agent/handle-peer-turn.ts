import { claimJob, clearAssigneeAndReopen, updateJob } from "@/db/jobs";
import { createPayment, getPaymentByJobId } from "@/db/payments";
import {
  adjustCredits,
  getUserByIdAdmin,
  getUserByPhone,
  upsertUserByPhone,
} from "@/db/users";
import { payoutFromTreasury } from "@/libs/dynamic/treasury";
import { sendChatMessage } from "@/libs/linq";
import { FUNDED_VIA, JOB_STATUS, type Job } from "@/utils/schema/job";
import { PAYMENT_STATUS } from "@/utils/schema/payment";
import { USER_ROLE } from "@/utils/schema/user";
import { broadcastJobToPeers } from "./broadcast-peers";
import { getPayUrl } from "./pay-url";
import {
  alreadyHaveBalanceNudge,
  fallbackReply,
  fundedViaCreditsReply,
  peerClaimedPeerReply,
  peerClaimedRequesterReply,
  peerDeliveredRequesterReply,
  peerFundedReply,
  peerPaidReply,
  peerQuoteReply,
  paymentPendingReply,
} from "./reply-templates";
import { AGENT_ACTION, AGENT_INTENT, type AgentAction, type AgentIntent } from "./types";

interface PeerTurn {
  job: Job;
  intent: AgentIntent;
  text: string;
  senderHandle: string;
  chatId: string;
}

interface PeerOutcome {
  action: AgentAction;
  reply: string;
  effect?: "confetti";
  /** Extra outbound messages (e.g. notify peer). */
  sideReplies?: Array<{ chatId: string; text: string }>;
}

export async function quotePeerJob(job: Job): Promise<PeerOutcome> {
  const priceCents = job.priceUsdCents ?? 1200;
  await createPayment({
    jobId: job.id,
    amountCents: priceCents,
    currency: "usd",
  });

  await updateJob(job.id, {
    status: JOB_STATUS.quoted,
    priceUsdCents: priceCents,
    quotedTotalCents: priceCents,
    quotedCurrency: "usd",
  });

  const requester = await getUserByPhone(job.requesterHandle);
  const nudge =
    requester && requester.creditBalance > 0
      ? `\n${alreadyHaveBalanceNudge()}`
      : "";

  return {
    action: AGENT_ACTION.quoted,
    reply:
      peerQuoteReply({
        title: job.title,
        priceCents,
        payUrl: getPayUrl(job.id),
      }) + nudge,
  };
}

export async function handlePeerTurn(turn: PeerTurn): Promise<PeerOutcome> {
  const status =
    turn.job.status === JOB_STATUS.draftReady
      ? JOB_STATUS.quoted
      : turn.job.status;

  switch (status) {
    case JOB_STATUS.quoted:
    case JOB_STATUS.paymentPending:
      return handlePeerQuoted(turn);
    case JOB_STATUS.funded:
      return handlePeerFunded(turn);
    case JOB_STATUS.claimed:
      return handlePeerClaimed(turn);
    case JOB_STATUS.delivered:
      return handlePeerDelivered(turn);
    case JOB_STATUS.approved:
      return handlePeerApproved(turn);
    default:
      return { action: AGENT_ACTION.fallback, reply: fallbackReply() };
  }
}

async function handlePeerQuoted(turn: PeerTurn): Promise<PeerOutcome> {
  const { job, intent } = turn;

  if (intent === AGENT_INTENT.payCredits) {
    const requester = await upsertUserByPhone({
      phone: job.requesterHandle,
      role: USER_ROLE.both,
    });
    const priceCredits = Math.max(
      1,
      Math.ceil((job.priceUsdCents ?? 1200) / 100)
    );
    if (requester.creditBalance < priceCredits) {
      return {
        action: AGENT_ACTION.paymentPending,
        reply: `Not enough credits (${requester.creditBalance}/${priceCredits}). ${paymentPendingReply(getPayUrl(job.id))}`,
      };
    }

    await adjustCredits({
      userId: requester.id,
      deltaCredits: -priceCredits,
      jobId: job.id,
      reason: "peer_job_payment",
    });
    await updateJob(job.id, {
      status: JOB_STATUS.funded,
      fundedVia: FUNDED_VIA.credits,
    });
    await broadcastJobToPeers(job);
    return {
      action: AGENT_ACTION.funded,
      reply: fundedViaCreditsReply(job.title),
    };
  }

  const payment = await getPaymentByJobId(job.id);
  if (payment?.status === PAYMENT_STATUS.settled) {
    return markPeerFunded(job);
  }

  return {
    action: AGENT_ACTION.paymentPending,
    reply: paymentPendingReply(getPayUrl(job.id)),
  };
}

export async function markPeerFunded(job: Job): Promise<PeerOutcome> {
  await updateJob(job.id, {
    status: JOB_STATUS.funded,
    fundedVia: FUNDED_VIA.wallet,
  });
  const refreshed: Job = { ...job, status: JOB_STATUS.funded };
  await broadcastJobToPeers(refreshed);
  return {
    action: AGENT_ACTION.funded,
    reply: peerFundedReply(job.title),
  };
}

async function handlePeerFunded(turn: PeerTurn): Promise<PeerOutcome> {
  const { job, intent, senderHandle, chatId } = turn;
  if (intent !== AGENT_INTENT.affirm) {
    return {
      action: AGENT_ACTION.statusReported,
      reply: `Still open for claim — first peer tapback wins.`,
    };
  }

  // Requester affirming on funded job is a no-op; peers claim from their thread.
  if (senderHandle === job.requesterHandle && chatId === job.linqChatId) {
    return {
      action: AGENT_ACTION.statusReported,
      reply: `Waiting for a peer to claim. I'll text you when someone does.`,
    };
  }

  const peer = await upsertUserByPhone({
    phone: senderHandle,
    role: USER_ROLE.peer,
  });

  const claimed = await claimJob({
    jobId: job.id,
    assigneeUserId: peer.id,
    claimChatId: chatId,
  });

  if (!claimed) {
    return {
      action: AGENT_ACTION.statusReported,
      reply: `Someone else already claimed this one — thanks anyway.`,
    };
  }

  const peerName = peer.fullName ?? senderHandle;
  // Notify requester on the original job chat.
  try {
    await sendChatMessage({
      chatId: job.linqChatId,
      text: peerClaimedRequesterReply(peerName),
      idempotencyKey: `claim-notify-${job.id}`,
    });
  } catch (error) {
    console.warn("Failed to notify requester of claim", error);
  }

  return {
    action: AGENT_ACTION.claimed,
    reply: peerClaimedPeerReply(job.title),
  };
}

async function handlePeerClaimed(turn: PeerTurn): Promise<PeerOutcome> {
  const { job, intent, text, senderHandle } = turn;

  if (!job.assigneeUserId) {
    return { action: AGENT_ACTION.fallback, reply: fallbackReply() };
  }

  const assignee = await getUserByIdAdmin(job.assigneeUserId);
  const isAssignee = assignee?.phone === senderHandle;

  if (isAssignee && intent === AGENT_INTENT.freeform) {
    await updateJob(job.id, {
      status: JOB_STATUS.delivered,
      description: job.description
        ? `${job.description}\n\nDeliverable:\n${text}`
        : text,
    });

    try {
      await sendChatMessage({
        chatId: job.linqChatId,
        text: `Deliverable from ${assignee?.fullName ?? "peer"}:\n${text}\n\n${peerDeliveredRequesterReply()}`,
        idempotencyKey: `deliver-${job.id}-${Date.now()}`,
      });
    } catch (error) {
      console.warn("Failed to forward deliverable", error);
    }

    return {
      action: AGENT_ACTION.delivered,
      reply: `Forwarded to the requester. I'll ping you when they approve.`,
    };
  }

  if (senderHandle === job.requesterHandle) {
    return {
      action: AGENT_ACTION.statusReported,
      reply: `Peer is working on it — I'll forward their deliverable here.`,
    };
  }

  return {
    action: AGENT_ACTION.statusReported,
    reply: peerClaimedPeerReply(job.title),
  };
}

async function handlePeerDelivered(turn: PeerTurn): Promise<PeerOutcome> {
  const { job, intent, senderHandle } = turn;

  if (senderHandle !== job.requesterHandle) {
    return {
      action: AGENT_ACTION.statusReported,
      reply: `Waiting on requester approval.`,
    };
  }

  if (intent === AGENT_INTENT.decline) {
    const reopened = await clearAssigneeAndReopen(job.id);
    await broadcastJobToPeers(reopened);
    return {
      action: AGENT_ACTION.rejectedWork,
      reply: `Rejected — reopened for another peer.`,
    };
  }

  if (intent !== AGENT_INTENT.affirm) {
    return {
      action: AGENT_ACTION.statusReported,
      reply: peerDeliveredRequesterReply(),
    };
  }

  await updateJob(job.id, { status: JOB_STATUS.approved });
  return finalizePeerPayout({ ...job, status: JOB_STATUS.approved });
}

async function handlePeerApproved(turn: PeerTurn): Promise<PeerOutcome> {
  return finalizePeerPayout(turn.job);
}

export async function finalizePeerPayout(job: Job): Promise<PeerOutcome> {
  const amount = job.priceUsdCents ?? job.quotedTotalCents ?? 0;
  let wallet =
    (job.assigneeUserId &&
      (await getUserByIdAdmin(job.assigneeUserId))?.walletAddress) ||
    `0xpeer${(job.assigneeUserId ?? "unknown").replace(/-/g, "").slice(0, 32)}`;

  const payout = await payoutFromTreasury({
    jobId: job.id,
    toAddress: wallet,
    amountUsdcCents: amount,
  });

  if (job.assigneeUserId) {
    await adjustCredits({
      userId: job.assigneeUserId,
      deltaCredits: 1,
      jobId: job.id,
      reason: "peer_job_completed",
    });
  }

  await updateJob(job.id, { status: JOB_STATUS.paid });

  if (job.claimChatId) {
    try {
      await sendChatMessage({
        chatId: job.claimChatId,
        text: `Payout complete (sandbox): ${payout.explorerUrl}`,
        effect: "confetti",
        idempotencyKey: `payout-peer-${job.id}`,
      });
    } catch (error) {
      console.warn("Failed to notify peer of payout", error);
    }
  }

  return {
    action: AGENT_ACTION.paid,
    reply: peerPaidReply(payout.explorerUrl),
    effect: "confetti",
  };
}
