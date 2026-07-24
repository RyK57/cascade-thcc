import { updateJob } from "@/db/jobs";
import { isLinqConfigured, sendStatusCard, updateStatusCard } from "@/libs/linq";
import { generateCardImage, isRunwareConfigured } from "@/libs/runware";
import { ROUTES } from "@/lib/constants/routes";
import { getPublicSiteUrl } from "@/lib/constants/site";
import type { Job } from "@/utils/schema/job";
import { formatCents } from "./reply-templates";

export const HUD_STAGE = {
  quoted: "quoted",
  funded: "funded",
  claimed: "claimed",
  delivered: "delivered",
  paid: "paid",
  launched: "launched",
  inReview: "in_review",
  paymentPending: "payment_pending",
  answered: "answered",
} as const;

export type HudStage = (typeof HUD_STAGE)[keyof typeof HUD_STAGE];

function jobStatusUrl(jobId: string): string {
  return `${getPublicSiteUrl()}${ROUTES.job(jobId)}`;
}

/**
 * A price a person could actually be charged. Quotes are clamped positive at
 * source, but a stale or malformed row must still never render as "-$3.60".
 */
function displayPrice(job: Job): string {
  const cents = job.priceUsdCents ?? job.quotedTotalCents;
  if (cents === undefined || cents <= 0) return "quoting";
  return formatCents(cents, job.quotedCurrency);
}

function stageCopy(job: Job, stage: HudStage): {
  caption: string;
  subcaption: string;
  trailingCaption: string;
  fallbackText: string;
} {
  // Only ever a real, payable amount. Routing economics (expected value, peer
  // vs expert comparisons) stay server-side: they are how Cascade decides, not
  // something a requester is being asked to agree to, and rendering a negative
  // EV next to a price reads as "the expert costs -$3.60".
  const price = displayPrice(job);

  switch (stage) {
    case HUD_STAGE.quoted:
      return {
        caption: "Cascade · Quoted",
        subcaption: job.title,
        trailingCaption: price,
        fallbackText: `Quote ready — ❤️ approve / 👎 reject. ${price}.`,
      };
    case HUD_STAGE.funded:
      return {
        caption: "Cascade · Funded",
        subcaption: "Escrow held until you approve",
        trailingCaption: price,
        fallbackText: `Escrow held for "${job.title}". Finding someone now.`,
      };
    case HUD_STAGE.claimed:
      return {
        caption: "Cascade · Claimed",
        subcaption: job.title,
        trailingCaption: "in progress",
        fallbackText: `A peer claimed "${job.title}". Deliverable coming next.`,
      };
    case HUD_STAGE.delivered:
      return {
        caption: "Cascade · Delivered",
        subcaption: "Awaiting your approval",
        trailingCaption: "review",
        fallbackText: `Deliverable in — ❤️ approve / 👎 reject.`,
      };
    case HUD_STAGE.paid:
      return {
        caption: "Cascade · Paid",
        subcaption: job.title,
        trailingCaption: "released",
        fallbackText: `Paid — agent wallet released escrow for "${job.title}".`,
      };
    case HUD_STAGE.launched:
      return {
        caption: "Cascade · Expert live",
        subcaption: job.title,
        trailingCaption: price,
        fallbackText: `Your brief is live with verified experts for "${job.title}".`,
      };
    case HUD_STAGE.inReview:
      return {
        caption: "Cascade · Review",
        subcaption: "Expert deliverable ready",
        trailingCaption: "review",
        fallbackText: `Expert work ready — ❤️ accept (billed on approval).`,
      };
    case HUD_STAGE.paymentPending:
      return {
        caption: "Cascade · Pay",
        subcaption: `Fund agent wallet · ${price}`,
        trailingCaption: price,
        fallbackText: `Payment pending for "${job.title}" — ${price}.`,
      };
    case HUD_STAGE.answered:
      return {
        caption: "Cascade · AI done",
        subcaption: job.title,
        trailingCaption: "free",
        fallbackText: `AI answered "${job.title}" for free.`,
      };
  }
}

/**
 * Send or redraw the in-thread status HUD. Persists the latest message id
 * (Linq updateAppCard returns a NEW id).
 */
export async function syncJobHud(
  job: Job,
  stage: HudStage
): Promise<Job> {
  if (!isLinqConfigured()) return job;

  const copy = stageCopy(job, stage);
  const url = jobStatusUrl(job.id);

  // Runware hero art — deterministic seed per job keeps the same artwork
  // across HUD updates. Best-effort; cards render fine without it.
  let imageUrl: string | undefined;
  if (isRunwareConfigured()) {
    imageUrl = await generateCardImage({
      jobId: job.id,
      title: job.title,
      tier: job.tier,
    });
  }

  try {
    let messageId: string;
    let usedCard: boolean;

    if (job.statusCardMessageId) {
      ({ messageId, usedCard } = await updateStatusCard({
        previousMessageId: job.statusCardMessageId,
        chatId: job.linqChatId,
        handle: job.requesterHandle,
        url,
        layout: {
          caption: copy.caption,
          subcaption: copy.subcaption,
          trailingCaption: copy.trailingCaption,
          imageUrl,
        },
        fallbackText: copy.fallbackText,
        wasCard: Boolean(job.statusCardIsRich),
      }));
    } else {
      ({ messageId, usedCard } = await sendStatusCard({
        chatId: job.linqChatId,
        handle: job.requesterHandle,
        url,
        layout: {
          caption: copy.caption,
          subcaption: copy.subcaption,
          trailingCaption: copy.trailingCaption,
          imageUrl,
        },
        fallbackText: copy.fallbackText,
        idempotencyKey: `hud-${job.id}-${stage}`,
      }));
    }

    return updateJob(job.id, {
      statusCardMessageId: messageId,
      statusCardIsRich: usedCard,
    });
  } catch (error) {
    console.warn("[cascade] status HUD sync failed", error);
    return job;
  }
}
