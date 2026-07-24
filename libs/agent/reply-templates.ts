import type { TeracSubmissionStats } from "@/libs/terac";

export function formatCents(cents: number, currency = "usd"): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency.toUpperCase(),
  }).format(cents / 100);
}

interface DraftReadyContext {
  title: string;
  numParticipants: number;
  totalCents?: number;
  currency?: string;
}

export function draftReadyReply({
  title,
  numParticipants,
  totalCents,
  currency,
}: DraftReadyContext): string {
  const experts = `${numParticipants} verified expert${numParticipants === 1 ? "" : "s"}`;
  const cost =
    totalCents !== undefined
      ? `Estimated total: ${formatCents(totalCents, currency)}.`
      : "Terac is quoting the price now.";
  return `Draft ready for "${title}" — sourcing ${experts}. ${cost} Drafts are free; launching spends budget. Reply YES to launch, or tell me what to change.`;
}

export function teracUnavailableReply(title: string): string {
  return `Got it — I've logged "${title}". Expert sourcing isn't connected yet, so I'll start the search as soon as it comes online and text you the quote.`;
}

export function launchedReply(title: string): string {
  return `Launched! I'm sourcing verified experts for "${title}" now. I'll text you here the moment work comes in for review.`;
}

export function keptDraftReply(): string {
  return `No problem — the draft stays free and unlaunched. Tell me what to change, or reply YES anytime to launch.`;
}

export function refinedReply(): string {
  return `Noted — I've updated the brief on the draft. Reply YES to launch when it looks right.`;
}

export function searchStatusReply(stats?: TeracSubmissionStats): string {
  if (!stats) {
    return `The search is live. No expert activity yet — I'll text you as soon as something needs your review.`;
  }
  return `Search update: ${stats.in_progress} in progress, ${stats.awaiting_review} awaiting review, ${stats.approved} approved. I'll ping you when a deliverable needs your call.`;
}

export function workReadyReply(count: number): string {
  return `${count} deliverable${count === 1 ? " is" : "s are"} in for your review. Reply YES to accept and kick off payment, or NO to reject and keep searching.`;
}

export function approvedWorkReply(payUrl: string, amountText?: string): string {
  const amount = amountText ? `Payment of ${amountText}` : "Payment";
  return `Accepted! ${amount} is queued through your Dynamic wallet — finish it here: ${payUrl}. I'll confirm on this thread once it settles.`;
}

export function rejectedWorkReply(): string {
  return `Rejected — the search stays live and I'll flag the next deliverable that comes in.`;
}

export function paymentPendingReply(payUrl: string): string {
  return `Payment is still pending. Complete it at ${payUrl} and I'll confirm here as soon as it settles.`;
}

export function paidReply(): string {
  return `Payment settled — you're all set! Text me a new request anytime and I'll spin up the next search.`;
}

export function errorReply(): string {
  return `I hit a snag on my end handling that — nothing was launched or spent. Give me a minute and text again.`;
}

export function fallbackReply(): string {
  return `I'm your expert-hiring agent. Text me what you need done — role, skills, timeline, budget — and I'll draft a search for verified experts on Terac. Drafts are free; nothing spends until you say launch.`;
}
