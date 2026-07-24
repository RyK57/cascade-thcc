import { updateJob } from "@/db/jobs";
import { isLinqConfigured, sendStatusCard, updateStatusCard } from "@/libs/linq";
import { generateCardImage, isRunwareConfigured } from "@/libs/runware";
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
  const site =
    process.env.NEXT_PUBLIC_SITE_URL?.trim() || "http://localhost:3000";
  return `${site.replace(/\/$/, "")}/job/${jobId}`;
}

function stageCopy(job: Job, stage: HudStage): {
  caption: string;
  subcaption: string;
  trailingCaption: string;
  fallbackText: string;
} {
  const price =
    job.priceUsdCents !== undefined
      ? formatCents(job.priceUsdCents, job.quotedCurrency)
      : job.quotedTotalCents !== undefined
        ? formatCents(job.quotedTotalCents, job.quotedCurrency)
        : "quoting";
  const ev = job.evSummary ? ` · ${job.evSummary.replace(/^Cascade EV:\s*/i, "EV ")}` : "";

  switch (stage) {
    case HUD_STAGE.quoted:
      return {
        caption: "Cascade · Quoted",
        subcaption: `${job.title}${ev}`,
        trailingCaption: price,
        fallbackText: `Quote ready — ❤️ approve / 👎 reject. ${price}.${ev}`,
      };
    case HUD_STAGE.funded:
      return {
        caption: "Cascade · Funded",
        subcaption: `Agent wallet holding escrow${ev}`,
        trailingCaption: price,
        fallbackText: `Escrow held in Cascade agent wallet for "${job.title}". First peer ❤️ claims it.`,
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
        subcaption: `${job.title}${ev}`,
        trailingCaption: price,
        fallbackText: `Terac search live for "${job.title}".`,
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
        fallbackText: `Sandbox escrow pending for "${job.title}" — ${price}.`,
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
