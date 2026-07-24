import { clearAssigneeAndReopen, updateJob } from "@/db/jobs";
import { getPaymentByJobId, updatePaymentStatus } from "@/db/payments";
import { adjustCredits, getUserByIdAdmin, upsertUserByPhone } from "@/db/users";
import { sendChatMessage } from "@/libs/linq";
import { JOB_STATUS, type Job } from "@/utils/schema/job";
import { PAYMENT_STATUS } from "@/utils/schema/payment";
import { USER_ROLE } from "@/utils/schema/user";
import {
  alreadyStoppedReply,
  nothingRunningReply,
  peerDroppedJobReply,
  peerJobCancelledNotice,
  stoppedAfterPayoutReply,
  stoppedBeforeChargeReply,
  stoppedWithRefundReply,
} from "./reply-templates";
import { AGENT_ACTION, type AgentAction } from "./types";

export interface StopTurn {
  job: Job;
  senderHandle: string;
  /** True when this turn created the job — there is nothing to stop yet. */
  isNewJob: boolean;
}

export interface StopOutcome {
  action: AgentAction;
  reply: string;
}

/** Escrow is committed from `funded` onward. */
const FUNDED_STATUSES = new Set<string>([
  JOB_STATUS.funded,
  JOB_STATUS.claimed,
  JOB_STATUS.delivered,
  JOB_STATUS.approved,
  JOB_STATUS.launched,
  JOB_STATUS.inReview,
]);

/**
 * "STOP" from the requester ends the job wherever it is, and returns escrow
 * that has not already left for a worker. From an assigned peer it means the
 * opposite thing — they are dropping the job, so it reopens for someone else.
 */
export async function handleStopTurn(turn: StopTurn): Promise<StopOutcome> {
  const { job, senderHandle, isNewJob } = turn;

  if (senderHandle !== job.requesterHandle) {
    return handleWorkerStop(turn);
  }

  if (isNewJob || (job.status === JOB_STATUS.intake && !job.tier)) {
    // Nothing was ever routed. Close the stub so it does not sit in intake.
    await updateJob(job.id, { status: JOB_STATUS.cancelled });
    return { action: AGENT_ACTION.cancelled, reply: nothingRunningReply() };
  }

  if (job.status === JOB_STATUS.cancelled) {
    return { action: AGENT_ACTION.cancelled, reply: alreadyStoppedReply() };
  }

  if (job.status === JOB_STATUS.paid) {
    return { action: AGENT_ACTION.cancelled, reply: stoppedAfterPayoutReply() };
  }

  const payment = await getPaymentByJobId(job.id).catch((error) => {
    console.warn("[cascade] stop: payment lookup failed", error);
    return null;
  });

  // A claimed release means the transfer is already on its way to the worker.
  // Cancel the job so nothing further runs, but never promise money back.
  if (payment?.escrowReleasedAt) {
    await updateJob(job.id, { status: JOB_STATUS.cancelled });
    await notifyAssignedPeer(job);
    return {
      action: AGENT_ACTION.cancelled,
      reply: stoppedAfterPayoutReply(),
    };
  }

  const escrowHeld =
    FUNDED_STATUSES.has(job.status) ||
    payment?.status === PAYMENT_STATUS.settled;

  let refundedCents = 0;
  if (escrowHeld) {
    refundedCents = await refundToBalance(job);
  }

  if (payment && payment.status !== PAYMENT_STATUS.cancelled) {
    await updatePaymentStatus(payment.id, PAYMENT_STATUS.cancelled).catch(
      (error) => {
        console.warn("[cascade] stop: payment cancel failed", error);
      }
    );
  }

  await updateJob(job.id, { status: JOB_STATUS.cancelled });
  await notifyAssignedPeer(job);

  return {
    action: AGENT_ACTION.cancelled,
    reply: refundedCents
      ? stoppedWithRefundReply(job.title, refundedCents)
      : stoppedBeforeChargeReply(job.title),
  };
}

/**
 * Return held escrow as Cascade balance. Credits are the one rail that settles
 * instantly and is already spendable in-thread ("pay with balance"); refunding
 * on-chain would need a signed transfer back to an address we may not hold.
 */
async function refundToBalance(job: Job): Promise<number> {
  const amountCents = job.priceUsdCents || job.quotedTotalCents || 0;
  if (amountCents <= 0) return 0;

  try {
    const requester = await upsertUserByPhone({
      phone: job.requesterHandle,
      role: USER_ROLE.both,
    });
    await adjustCredits({
      userId: requester.id,
      deltaCredits: Math.max(1, Math.ceil(amountCents / 100)),
      jobId: job.id,
      reason: "job_cancelled_refund",
    });
    return amountCents;
  } catch (error) {
    // Never fail the stop over a refund — the job still has to come to a halt.
    console.error("[cascade] stop: refund to balance failed", job.id, error);
    return 0;
  }
}

/** The peer working on this deserves to hear it from us, not from silence. */
async function notifyAssignedPeer(job: Job): Promise<void> {
  if (!job.claimChatId) return;
  try {
    await sendChatMessage({
      chatId: job.claimChatId,
      text: peerJobCancelledNotice(job.title),
      idempotencyKey: `cancel-notify-${job.id}`,
    });
  } catch (error) {
    console.warn("[cascade] stop: peer notify failed", error);
  }
}

/** A worker texting STOP is dropping the job, not cancelling the request. */
async function handleWorkerStop(turn: StopTurn): Promise<StopOutcome> {
  const { job, senderHandle } = turn;

  const assignee = job.assigneeUserId
    ? await getUserByIdAdmin(job.assigneeUserId)
    : null;

  if (!assignee || assignee.phone !== senderHandle) {
    return { action: AGENT_ACTION.cancelled, reply: nothingRunningReply() };
  }

  const reopened = await clearAssigneeAndReopen(job.id);
  try {
    await sendChatMessage({
      chatId: job.linqChatId,
      text: `The worker stepped off "${job.title}" — it's back in the pool and I'll text you when someone else claims it.`,
      idempotencyKey: `worker-drop-${job.id}`,
    });
  } catch (error) {
    console.warn("[cascade] stop: requester notify failed", error);
  }

  return {
    action: AGENT_ACTION.cancelled,
    reply: peerDroppedJobReply(reopened.title),
  };
}
