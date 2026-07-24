import {
  createJob,
  getJobByChatId,
  getJobByClaimChatId,
  getJobByStatusCardMessageId,
  getOldestClaimablePeerJob,
  MESSAGE_DIRECTION,
  recordJobMessage,
} from "@/db/jobs";
import { getUserByPhone } from "@/db/users";
import { ensurePhoneWallet } from "@/libs/dynamic/phone-wallet";
import {
  sendChatMessage,
  setTyping,
  type InboundLinqEvent,
} from "@/libs/linq";
import { captionImage, isRunwareConfigured } from "@/libs/runware";
import { JOB_STATUS, type Job } from "@/utils/schema/job";
import { USER_ROLE } from "@/utils/schema/user";
import {
  clipTitle,
  handleJobTurn,
  isAwaitingClarification,
} from "./handle-job-turn";
import { interpretMessage } from "./interpret-message";
import { errorReply } from "./reply-templates";
import { triageJob } from "./triage";
import {
  AGENT_ACTION,
  AGENT_INTENT,
  type AgentAction,
  type AgentTurnResult,
} from "./types";

/**
 * One full Cascade turn: persist inbound, triage when needed, advance the
 * tier state machine, reply on the same iMessage thread.
 */
export async function runAgentTurn(
  inbound: InboundLinqEvent
): Promise<AgentTurnResult> {
  const chatId = inbound.chatId;
  const senderHandle = inbound.senderHandle;
  const messageId =
    inbound.kind === "reaction" ? inbound.reactionId : inbound.messageId;
  let text =
    inbound.kind === "reaction"
      ? inbound.isAffirm
        ? "yes"
        : "no"
      : inbound.text;

  // Vision: caption inbound photos (texted or voice-sent from smart glasses)
  // so triage sees what the requester is looking at.
  if (
    inbound.kind === "text" &&
    inbound.mediaUrls?.length &&
    isRunwareConfigured()
  ) {
    const caption = await captionImage(
      inbound.mediaUrls[0],
      "Describe this photo as context for a task request. Note any objects, text, or problems visible."
    );
    if (caption) {
      text = text ? `${text}\n[Photo shows: ${caption}]` : `[Photo shows: ${caption}] Figure out what task I need from this.`;
    } else if (!text) {
      text = "I sent a photo — ask me what I need done with it.";
    }
  } else if (inbound.kind === "text" && !text && inbound.mediaUrls?.length) {
    text = "I sent a photo — ask me what I need done with it.";
  }

  let typingStarted = false;
  try {
    await setTyping(chatId, true);
    typingStarted = true;
  } catch {
    // typing is best-effort
  }

  try {
    // Pregenerate sandbox wallet on first inbound phone.
    try {
      await ensurePhoneWallet(senderHandle);
    } catch (error) {
      console.warn("[cascade] ensurePhoneWallet failed", error);
    }

    const intent =
      inbound.kind === "reaction"
        ? inbound.isAffirm
          ? AGENT_INTENT.affirm
          : AGENT_INTENT.decline
        : interpretMessage(text);

    const resolved = await resolveJob({
      chatId,
      senderHandle,
      messageId: inbound.kind === "reaction" ? inbound.messageId : undefined,
      intent,
    });

    const job =
      resolved.job ??
      (await createJob({
        linqChatId: chatId,
        requesterHandle: senderHandle,
        title: clipTitle(text),
        description: text,
      }));

    const isNewMessage = await recordJobMessage({
      jobId: job.id,
      linqMessageId: messageId,
      direction: MESSAGE_DIRECTION.inbound,
      body: text,
    });
    if (!isNewMessage) {
      return { action: AGENT_ACTION.duplicate, jobId: job.id };
    }

    const needsTriage =
      job.status === JOB_STATUS.intake ||
      ((job.status === JOB_STATUS.paid || job.status === JOB_STATUS.cancelled) &&
        intent === AGENT_INTENT.freeform);

    let action: AgentAction;
    let reply: string;
    let effect: "confetti" | undefined;

    try {
      const triage = needsTriage
        ? await triageJob({
            text,
            priorContext: job.description,
            alreadyClarified: isAwaitingClarification(job.triageReason),
          })
        : undefined;
      ({ action, reply, effect } = await handleJobTurn({
        job,
        intent,
        text,
        isNewJob: !resolved.job || resolved.created,
        senderHandle,
        chatId,
        triage,
      }));
    } catch (error) {
      console.error("Job turn failed:", error);
      action = AGENT_ACTION.errored;
      reply = errorReply();
    }

    if (typingStarted) {
      try {
        await setTyping(chatId, false);
        typingStarted = false;
      } catch {
        // ignore
      }
    }

    const sent = await sendChatMessage({
      chatId,
      text: reply,
      idempotencyKey: `turn-${messageId}`,
      effect,
    });
    await recordJobMessage({
      jobId: job.id,
      linqMessageId: sent.message?.id ?? `out_${crypto.randomUUID()}`,
      direction: MESSAGE_DIRECTION.outbound,
      body: reply,
    });

    return { action, reply, jobId: job.id, effect };
  } finally {
    if (typingStarted) {
      try {
        await setTyping(chatId, false);
      } catch {
        // ignore
      }
    }
  }
}

async function resolveJob(params: {
  chatId: string;
  senderHandle: string;
  messageId?: string;
  intent: string;
}): Promise<{ job: Job | null; created: boolean }> {
  if (params.messageId) {
    const byCard = await getJobByStatusCardMessageId(params.messageId);
    if (byCard) return { job: byCard, created: false };
  }

  const byChat = await getJobByChatId(params.chatId);
  if (byChat) return { job: byChat, created: false };

  const byClaim = await getJobByClaimChatId(params.chatId);
  if (byClaim) return { job: byClaim, created: false };

  const user = await getUserByPhone(params.senderHandle);
  const isPeer =
    user?.role === USER_ROLE.peer || user?.role === USER_ROLE.both;

  if (isPeer && params.intent === AGENT_INTENT.affirm) {
    const claimable = await getOldestClaimablePeerJob();
    if (claimable) return { job: claimable, created: false };
  }

  return { job: null, created: true };
}
