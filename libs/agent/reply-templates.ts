import type { TeracSubmissionStats } from "@/libs/terac";
import { BRAND } from "@/lib/constants/branding";

export function formatCents(cents: number, currency = "usd"): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency.toUpperCase(),
  }).format(cents / 100);
}

/**
 * The one line that precedes a quote. AI answers get no prefix at all — the
 * answer is the product, and "Cascade → ai: <model reason>" is debug output.
 */
export function routingReply(tier: string, _reason: string): string {
  void _reason;
  if (tier === "peer") return "Getting a real person on this.";
  if (tier === "expert") return "This needs a verified expert.";
  return "";
}

export function aiFollowUpSuggest(related: string): string {
  return related;
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
    `Quote for "${params.title}": ${price} USDC.${trust}`,
    `Fund escrow here: ${params.payUrl}`,
    `Nothing is paid out until you approve the work here with ❤️.`,
  ].join("\n");
}

export function peerFundedReply(title: string, evLine?: string): string {
  void evLine;
  return `Escrow held for "${title}". Sending it to peers now — first to claim gets it.`;
}

export function peerClaimBroadcast(params: {
  title: string;
  priceCents: number;
  trustScore: number;
  priorityHint?: string;
}): string {
  const priority = params.priorityHint ? ` ${params.priorityHint}` : "";
  return `Cascade job open: "${params.title}" • ${formatCents(params.priceCents)} USDC • your trust ${params.trustScore}.${priority} Tapback ❤️ / YES to claim, or text "bid N" credits for a second-price auction.`;
}

export function peerClaimedRequesterReply(peerName: string): string {
  return `${peerName} claimed your job. I'll forward their deliverable here when it lands.`;
}

export function peerClaimedPeerReply(title: string): string {
  return `You're on "${title}". Text your deliverable in this thread when done.`;
}

export function peerDeliveredRequesterReply(): string {
  return `Deliverable is in — ❤️ to approve and release payment, 👎 to reject.`;
}

export function peerPaidReply(explorerUrl: string): string {
  const receipt = explorerUrl.startsWith("http") ? `\nReceipt: ${explorerUrl}` : "";
  return `Approved — payment released to the peer.${receipt}`;
}

export function fundedExplorerReply(explorerUrl: string): string {
  return `Receipt: ${explorerUrl}`;
}

export function draftReadyReply(params: {
  title: string;
  numParticipants: number;
  totalCents?: number;
  currency?: string;
  roleLabel?: string;
}): string {
  const role = params.roleLabel ?? "verified expert";
  const experts = `${params.numParticipants} ${role}${params.numParticipants === 1 ? "" : "s"}`;
  const cost =
    params.totalCents !== undefined
      ? `${formatCents(params.totalCents, params.currency)}`
      : "quoting…";
  return `Expert quote for "${params.title}" — ${experts} • ${cost} • tapback ❤️ / YES to launch (drafts are free; launch spends), 👎 to hold. Billed on approval.`;
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
  return `${count} deliverable${count === 1 ? " is" : "s are"} ready. YES to accept and pay, NO to reject. Billed on approval.`;
}

export function approvedWorkReply(payUrl: string, amountText?: string): string {
  const amount = amountText ? ` of ${amountText}` : "";
  return [
    `Accepted! Escrow${amount} from your Cascade wallet.`,
    `Fund it here: ${payUrl}`,
  ].join("\n");
}

export function rejectedWorkReply(): string {
  return `Rejected — search stays live for the next deliverable.`;
}

export function paymentPendingReply(payUrl: string): string {
  return `Payment still pending: ${payUrl}`;
}

export function paidReply(explorerUrl?: string): string {
  const link = explorerUrl ? ` ${explorerUrl}` : "";
  return `Payment settled.${link} Text ${BRAND.name} another task anytime.`;
}

export function agentPayOfferReply(checkoutHint: string): string {
  return [
    `Got it — wallet path declined twice.`,
    `Fallback: Linq Agent Pay (Apple Pay in-thread). ${checkoutHint}`,
    `Note: wallet users skip fees and get escrow + instant payouts.`,
  ].join("\n");
}

export function claimEvLine(expectedValueCredits: number): string {
  return `Claim EV now ≈ ${expectedValueCredits.toFixed(1)} credits (higher trust peers see this first).`;
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
