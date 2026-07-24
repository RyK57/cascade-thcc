import { sendTextMessage } from "@/libs/linq";
import type { TriageResult } from "@/utils/schema/agent";
import { markMessageSeen, seenMessage } from "./dedupe";
import { normalizeLinqEvent } from "./normalize-event";
import { draftReply } from "./reply";
import { triageJob } from "./triage";

export interface HandleInboundResult {
  status: "ignored" | "duplicate" | "handled";
  reason?: string;
  triage?: TriageResult;
  reply?: string;
}

/**
 * One agent turn: normalize the webhook event, dedupe, triage the task,
 * and reply in-thread. The `crowd` / `expert` branches currently acknowledge
 * and route; the next stage wires them to a live Terac opportunity + Dynamic payout.
 */
export async function handleInbound(raw: unknown): Promise<HandleInboundResult> {
  const event = normalizeLinqEvent(raw);
  if (!event) {
    return { status: "ignored", reason: "unrecognized or non-message event" };
  }

  if (seenMessage(event.messageId)) {
    return { status: "duplicate" };
  }
  markMessageSeen(event.messageId);

  const triage = await triageJob(event.text);
  const reply = draftReply(triage);

  // Reply on the same thread: our Linq number sends back to the person who texted.
  await sendTextMessage({ from: event.to, to: [event.from], text: reply });

  // TODO(next stage): if triage.tier is "crowd"/"expert" and !needsClarification,
  // create a Terac opportunity here and persist chat<->job<->opportunity IDs.

  return { status: "handled", triage, reply };
}
