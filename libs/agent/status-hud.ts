import { updateJob } from "@/db/jobs";
import { isLinqConfigured, sendStatusCard, updateStatusCard } from "@/libs/linq";
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

function stageCopy(job: Job, stage: HudStage): {
  caption: string;
  subcaption: string;
  fallbackText: string;
} {
  const price =
    job.priceUsdCents !== undefined
      ? formatCents(job.priceUsdCents, job.quotedCurrency)
      : job.quotedTotalCents !== undefined
        ? formatCents(job.quotedTotalCents, job.quotedCurrency)
        : "quoting";

  switch (stage) {
    case HUD_STAGE.quoted:
      return {
        caption: "Cascade · Quoted",
        subcaption: `${job.title} · ${price}`,
        fallbackText: `Quote ready — tapback heart to approve or thumbs-down to reject. ${price}.`,
      };
    case HUD_STAGE.funded:
      return {
        caption: "Cascade · Funded",
        subcaption: `${job.title} · escrow locked`,
        fallbackText: `Escrow funded for "${job.title}". First peer tapback claims it.`,
      };
    case HUD_STAGE.claimed:
      return {
        caption: "Cascade · Claimed",
        subcaption: job.title,
        fallbackText: `A peer claimed "${job.title}". Deliverable coming next.`,
      };
    case HUD_STAGE.delivered:
      return {
        caption: "Cascade · Delivered",
        subcaption: "Awaiting your approval",
        fallbackText: `Deliverable in — tapback heart to approve or thumbs-down to reject.`,
      };
    case HUD_STAGE.paid:
      return {
        caption: "Cascade · Paid",
        subcaption: job.title,
        fallbackText: `Paid — "${job.title}" complete.`,
      };
    case HUD_STAGE.launched:
      return {
        caption: "Cascade · Expert live",
        subcaption: `${job.title} · ${price}`,
        fallbackText: `Terac search live for "${job.title}".`,
      };
    case HUD_STAGE.inReview:
      return {
        caption: "Cascade · Review",
        subcaption: "Expert deliverable ready",
        fallbackText: `Expert work ready — tapback heart to accept (billed on approval).`,
      };
    case HUD_STAGE.paymentPending:
      return {
        caption: "Cascade · Pay",
        subcaption: `${price} sandbox USDC`,
        fallbackText: `Sandbox payment pending for "${job.title}" — ${price}.`,
      };
    case HUD_STAGE.answered:
      return {
        caption: "Cascade · AI done",
        subcaption: job.title,
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

  try {
    let messageId: string;
    let usedCard: boolean;

    if (job.statusCardMessageId) {
      ({ messageId, usedCard } = await updateStatusCard({
        previousMessageId: job.statusCardMessageId,
        chatId: job.linqChatId,
        handle: job.requesterHandle,
        layout: {
          caption: copy.caption,
          subcaption: copy.subcaption,
        },
        fallbackText: copy.fallbackText,
        wasCard: Boolean(job.statusCardIsRich),
      }));
    } else {
      ({ messageId, usedCard } = await sendStatusCard({
        chatId: job.linqChatId,
        handle: job.requesterHandle,
        layout: {
          caption: copy.caption,
          subcaption: copy.subcaption,
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
