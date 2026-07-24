import {
  createJob,
  getJobByChatId,
  MESSAGE_DIRECTION,
  recordJobMessage,
} from "@/db/jobs";
import { sendChatMessage, type InboundLinqMessage } from "@/libs/linq";
import { clipTitle, handleJobTurn } from "./handle-job-turn";
import { interpretMessage } from "./interpret-message";
import { errorReply } from "./reply-templates";
import {
  AGENT_ACTION,
  type AgentAction,
  type AgentTurnResult,
} from "./types";

/**
 * One full agent turn: persist the inbound Linq message, advance the job
 * state machine (Terac drafts/launch/review + Dynamic payment state), and
 * reply on the same iMessage thread.
 */
export async function runAgentTurn(
  inbound: InboundLinqMessage
): Promise<AgentTurnResult> {
  const existing = await getJobByChatId(inbound.chatId);
  const job =
    existing ??
    (await createJob({
      linqChatId: inbound.chatId,
      requesterHandle: inbound.senderHandle,
      title: clipTitle(inbound.text),
      description: inbound.text,
    }));

  const isNewMessage = await recordJobMessage({
    jobId: job.id,
    linqMessageId: inbound.messageId,
    direction: MESSAGE_DIRECTION.inbound,
    body: inbound.text,
  });
  if (!isNewMessage) {
    return { action: AGENT_ACTION.duplicate, jobId: job.id };
  }

  let action: AgentAction;
  let reply: string;
  try {
    ({ action, reply } = await handleJobTurn({
      job,
      intent: interpretMessage(inbound.text),
      text: inbound.text,
      isNewJob: !existing,
    }));
  } catch (error) {
    // Still reply on the thread — silence reads as a dead agent.
    console.error("Job turn failed:", error);
    action = AGENT_ACTION.errored;
    reply = errorReply();
  }

  const sent = await sendChatMessage({ chatId: inbound.chatId, text: reply });
  await recordJobMessage({
    jobId: job.id,
    linqMessageId: sent.message?.id ?? `out_${crypto.randomUUID()}`,
    direction: MESSAGE_DIRECTION.outbound,
    body: reply,
  });

  return { action, reply, jobId: job.id };
}
