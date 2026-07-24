import { listPeers } from "@/db/users";
import {
  isLinqConfigured,
  sendChatMessage,
  sendTextMessage,
} from "@/libs/linq";
import type { Job } from "@/utils/schema/job";
import { peerClaimBroadcast } from "./reply-templates";

/**
 * Ping seeded peers (inbound-first: skip failures). Highest trust first.
 */
export async function broadcastJobToPeers(job: Job): Promise<number> {
  if (!isLinqConfigured()) return 0;

  const peers = await listPeers();
  const priceCents = job.priceUsdCents ?? job.quotedTotalCents ?? 0;
  let sent = 0;

  const from =
    process.env.LINQ_FROM_NUMBER?.trim() ||
    process.env.LINQ_PHONE_NUMBER?.trim();

  for (const peer of peers) {
    if (!peer.phone) continue;
    if (peer.phone === job.requesterHandle) continue;

    const text = peerClaimBroadcast({
      title: job.title,
      priceCents,
      trustScore: peer.trustScore,
    });

    try {
      if (from) {
        await sendTextMessage({ from, to: [peer.phone], text });
      } else {
        // Without a from-number, try opening via chats API is handled inside sendTextMessage;
        // if LINQ_FROM_NUMBER missing, log and continue.
        console.warn(
          `[cascade] skip peer broadcast to ${peer.phone}: set LINQ_FROM_NUMBER`
        );
        continue;
      }
      sent += 1;
    } catch (error) {
      console.warn(
        `[cascade] peer broadcast failed for ${peer.phone} (inbound-first?)`,
        error
      );
    }
  }

  // Keep sendChatMessage import warm for future claim-thread replies.
  void sendChatMessage;
  return sent;
}
