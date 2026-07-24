import { listPeers } from "@/db/users";
import {
  haversineKm,
  isLinqConfigured,
  sendTextMessage,
} from "@/libs/linq";
import type { Job } from "@/utils/schema/job";
import { peerClaimBroadcast } from "./reply-templates";

/**
 * Ping seeded peers (inbound-first: skip failures). Highest trust first;
 * optional proximity boost when the job has requester coords.
 */
export async function broadcastJobToPeers(job: Job): Promise<number> {
  if (!isLinqConfigured()) return 0;

  let peers = await listPeers();
  const priceCents = job.priceUsdCents ?? job.quotedTotalCents ?? 0;
  let sent = 0;

  if (
    job.requesterLat !== undefined &&
    job.requesterLng !== undefined
  ) {
    const origin = { lat: job.requesterLat, lng: job.requesterLng };
    peers = [...peers].sort((a, b) => {
      const da =
        a.lastLat !== undefined && a.lastLng !== undefined
          ? haversineKm(origin, { lat: a.lastLat, lng: a.lastLng })
          : Number.POSITIVE_INFINITY;
      const db =
        b.lastLat !== undefined && b.lastLng !== undefined
          ? haversineKm(origin, { lat: b.lastLat, lng: b.lastLng })
          : Number.POSITIVE_INFINITY;
      if (da !== db) return da - db;
      return b.trustScore - a.trustScore;
    });
  }

  const from =
    process.env.LINQ_FROM_NUMBER?.trim() ||
    process.env.LINQ_PHONE_NUMBER?.trim();

  let index = 0;
  for (const peer of peers) {
    if (!peer.phone) continue;
    if (peer.phone === job.requesterHandle) continue;

    const priorityHint =
      index === 0 || peer.trustScore >= 80
        ? "Priority queue — you see this first."
        : "Priority queue — higher-trust peers were messaged first.";

    const text = peerClaimBroadcast({
      title: job.title,
      priceCents,
      trustScore: peer.trustScore,
      priorityHint,
    });

    try {
      if (from) {
        await sendTextMessage({ from, to: [peer.phone], text });
      } else {
        console.warn(
          `[cascade] skip peer broadcast to ${peer.phone}: set LINQ_FROM_NUMBER`
        );
        continue;
      }
      sent += 1;
      index += 1;
    } catch (error) {
      console.warn(
        `[cascade] peer broadcast failed for ${peer.phone} (inbound-first?)`,
        error
      );
    }
  }

  return sent;
}
