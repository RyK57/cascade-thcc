import { updateJob } from "@/db/jobs";
import { getUserByPhone, upsertUserByPhone } from "@/db/users";
import { retrieveLocation } from "@/libs/linq/location";
import type { Job } from "@/utils/schema/job";
import { USER_ROLE } from "@/utils/schema/user";

export interface TexterLocation {
  lat: number;
  lng: number;
  /** Where the coords came from — for prompts and debugging. */
  source: "live" | "job" | "profile";
}

/**
 * Resolve the texter's location for this turn.
 * Preference: live Linq share → coords already on the job → last known on user.
 * When a live share is found, persist it onto the job and user profile.
 */
export async function resolveTexterLocation(params: {
  chatId: string;
  phone: string;
  job?: Job | null;
}): Promise<TexterLocation | null> {
  const live = await retrieveLocation(params.chatId).catch(() => null);
  if (live?.lat !== undefined && live?.lng !== undefined) {
    const location: TexterLocation = {
      lat: live.lat,
      lng: live.lng,
      source: "live",
    };
    try {
      await persistTexterLocation({
        jobId: params.job?.id,
        phone: params.phone,
        location,
      });
    } catch (error) {
      console.warn("[cascade] persist texter location failed", error);
    }
    return location;
  }

  if (
    params.job?.requesterLat !== undefined &&
    params.job?.requesterLng !== undefined
  ) {
    return {
      lat: params.job.requesterLat,
      lng: params.job.requesterLng,
      source: "job",
    };
  }

  const user = await getUserByPhone(params.phone).catch(() => null);
  if (user?.lastLat !== undefined && user?.lastLng !== undefined) {
    const location: TexterLocation = {
      lat: user.lastLat,
      lng: user.lastLng,
      source: "profile",
    };
    // Attach known profile coords onto the job so peer ranking can use them.
    if (params.job?.id) {
      try {
        await updateJob(params.job.id, {
          requesterLat: location.lat,
          requesterLng: location.lng,
        });
      } catch (error) {
        console.warn("[cascade] attach profile location to job failed", error);
      }
    }
    return location;
  }

  return null;
}

async function persistTexterLocation(params: {
  jobId?: string;
  phone: string;
  location: TexterLocation;
}): Promise<void> {
  if (params.jobId) {
    await updateJob(params.jobId, {
      requesterLat: params.location.lat,
      requesterLng: params.location.lng,
    });
  }
  await upsertUserByPhone({
    phone: params.phone,
    role: USER_ROLE.both,
    lastLat: params.location.lat,
    lastLng: params.location.lng,
  });
}

/** Compact line for LLM prompts. */
export function formatTexterLocation(location: TexterLocation): string {
  const lat = location.lat.toFixed(5);
  const lng = location.lng.toFixed(5);
  const freshness =
    location.source === "live"
      ? "live share from this chat"
      : location.source === "job"
        ? "saved on this job"
        : "last known from their profile";
  return `approx ${lat}, ${lng} (${freshness})`;
}
