import { listPeers } from "@/db/users";
import {
  getLinqFromNumber,
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
  const priceCents = job.priceUsdCents || job.quotedTotalCents || 0;
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

  const from = getLinqFromNumber();

  for (const peer of peers) {
    if (!peer.phone) continue;
    if (peer.phone === job.requesterHandle) continue;

    // Trust and proximity still order this loop; neither is quoted back to
    // the worker.
    const text = peerClaimBroadcast({
      title: job.title,
      priceCents,
      description: job.description,
      lat: job.requesterLat,
      lng: job.requesterLng,
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
    } catch (error) {
      console.warn(
        `[cascade] peer broadcast failed for ${peer.phone} (inbound-first?)`,
        error
      );
    }
  }

  return sent;
}
