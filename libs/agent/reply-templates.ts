import type { TeracSubmissionStats } from "@/libs/terac";
import { BRAND } from "@/lib/constants/branding";

export function formatCents(cents: number, currency = "usd"): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency.toUpperCase(),
  }).format(cents / 100);
}

export function routingReply(tier: string, reason: string): string {
  return `Cascade → ${tier}: ${reason}`;
}

export function aiFollowUpSuggest(related: string): string {
  return `Related idea: ${related}`;
}

export function peerQuoteReply(params: {
  title: string;
  priceCents: number;
  payUrl: string;
  trustHint?: string;
}): string {
  const price = formatCents(params.priceCents);
  const trust = params.trustHint ? ` ${params.trustHint}` : "";
  return [
    `Peer quote for "${params.title}": ${price} sandbox USDC.${trust}`,
    `Fastest way to pay: your Cascade wallet — takes 20 seconds, just your email, no seed phrase, and payouts you earn land there instantly.`,
    `Pay here: ${params.payUrl}`,
    `Or reply "pay with credits" if you have enough. Tapback ❤️ / reply YES after funding confirms.`,
  ].join("\n");
}

export function peerFundedReply(title: string): string {
  return `Escrow funded for "${title}" (sandbox). Broadcasting to Cascade peers — first tapback claims it.`;
}

export function peerClaimBroadcast(params: {
  title: string;
  priceCents: number;
  trustScore: number;
}): string {
  return `Cascade job open: "${params.title}" • ${formatCents(params.priceCents)} sandbox USDC • your trust ${params.trustScore}. Tapback ❤️ or reply YES to claim.`;
}

export function peerClaimedRequesterReply(peerName: string): string {
  return `${peerName} claimed your job. I'll forward their deliverable here when it lands.`;
}

export function peerClaimedPeerReply(title: string): string {
  return `You're on "${title}". Text your deliverable in this thread when done.`;
}

export function peerDeliveredRequesterReply(): string {
  return `Deliverable in — reply YES / tapback ❤️ to approve (sandbox payout fires instantly), or NO to reject.`;
}

export function peerPaidReply(explorerUrl: string): string {
  return `Approved + sandbox payout sent. ${explorerUrl}`;
}

export function draftReadyReply(params: {
  title: string;
  numParticipants: number;
  totalCents?: number;
  currency?: string;
}): string {
  const experts = `${params.numParticipants} verified expert${params.numParticipants === 1 ? "" : "s"}`;
  const cost =
    params.totalCents !== undefined
      ? `${formatCents(params.totalCents, params.currency)}`
      : "quoting…";
  return `Expert quote for "${params.title}" — ${experts} • ${cost} • tapback ❤️ or reply YES to launch (drafts are free; launch spends). Billed on approval.`;
}

export function teracUnavailableReply(title: string): string {
  return `Logged "${title}". Terac isn't connected yet — I'll quote a verified expert as soon as it comes online.`;
}

export function launchedReply(title: string): string {
  return `Launched on Terac for "${title}". I'll text when a deliverable needs review (billed only if you approve).`;
}

export function keptDraftReply(): string {
  return `Draft stays free. Tell me what to change, or YES anytime to launch.`;
}

export function refinedReply(): string {
  return `Brief updated. Reply YES to launch when it looks right.`;
}

export function searchStatusReply(stats?: TeracSubmissionStats): string {
  if (!stats) {
    return `Search is live. No expert activity yet — I'll ping you when something needs review.`;
  }
  return `Search update: ${stats.in_progress} in progress, ${stats.awaiting_review} awaiting review, ${stats.approved} approved.`;
}

export function workReadyReply(count: number): string {
  return `${count} deliverable${count === 1 ? " is" : "s are"} ready. YES to accept (then sandbox pay), NO to reject. Billed on approval.`;
}

export function approvedWorkReply(payUrl: string, amountText?: string): string {
  const amount = amountText ? ` of ${amountText}` : "";
  return [
    `Accepted! Sandbox escrow${amount} via your Cascade wallet.`,
    `Fastest way to pay: email login, no seed phrase — ${payUrl}`,
  ].join("\n");
}

export function rejectedWorkReply(): string {
  return `Rejected — search stays live for the next deliverable.`;
}

export function paymentPendingReply(payUrl: string): string {
  return `Sandbox payment still pending: ${payUrl}`;
}

export function paidReply(): string {
  return `Sandbox payment settled — you're set. Text ${BRAND.name} another task anytime.`;
}

export function fundedViaCreditsReply(title: string): string {
  return `Paid with Cascade credits for "${title}". Broadcasting to peers now.`;
}

export function errorReply(): string {
  return `Hit a snag — nothing was launched or spent. Text again in a moment.`;
}

export function fallbackReply(): string {
  return `${BRAND.name} routes tasks to AI (free), peers, or Terac experts over iMessage. Text what you need done.`;
}

export function alreadyHaveBalanceNudge(): string {
  return `You already have a Cascade wallet balance from peer earnings — pay from there in one tap.`;
}
