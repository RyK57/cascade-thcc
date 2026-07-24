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
  /** Pre-rendered amount + rate + gas line from `buildPaymentQuote`. */
  quoteLine?: string;
}): string {
  const price = params.quoteLine ?? `${formatCents(params.priceCents)} USDC`;
  const trust = params.trustHint ? ` ${params.trustHint}` : "";
  return [
    `Quote for "${params.title}": ${price}.${trust}`,
    `❤️ this message to approve and fund it, or pay here: ${params.payUrl}`,
    `Prefer ETH? Reply "pay in eth". Have a balance? Reply "pay with balance".`,
    `Nothing reaches the worker until you approve their work — or text STOP to cancel.`,
  ].join("\n");
}

export function peerFundedReply(title: string): string {
  // The one place the web app gets mentioned unprompted: money just moved, so
  // "where can I see this?" is a question the person is actually asking.
  return `Escrow held for "${title}". Finding someone now — I'll bring their work back here.\n${accountLinkHint()}`;
}

/**
 * The offer a peer sees. Their trust score and the auction mechanics decide
 * who gets pinged first, but quoting either back at them is Cascade narrating
 * its own scoring — what a worker needs is the task, the pay, and how to take
 * it.
 */
export function peerClaimBroadcast(params: {
  title: string;
  priceCents: number;
}): string {
  return `Cascade job open: "${params.title}" • ${formatCents(params.priceCents)} USDC. Tapback ❤️ or reply YES to claim, or text "bid N" to name your price.`;
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
  const receipt = explorerUrl.startsWith("http")
    ? `\nReceipt: ${explorerUrl}`
    : explorerUrl
      ? `\n${explorerUrl}`
      : "";
  return `Approved — payment released to the peer.${receipt}`;
}

/**
 * The escrow release slot is claimed but no payout is recorded yet — either a
 * concurrent release is in flight, or an earlier one failed after claiming.
 * Never say "paid" here; we have no evidence the transfer landed.
 */
export function peerPayoutInFlightReply(): string {
  return `Approved. The payout is still confirming — you'll get the receipt here as soon as it lands.`;
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

/**
 * First of two gates for expert work. Terac hires a real person on a real
 * schedule, so the turnaround is disclosed and acknowledged on its own —
 * a "yes" to a timeline must never double as a "yes" to a charge.
 */
export function expertTimelineDisclaimer(params: {
  title: string;
  roleLabel?: string;
}): string {
  const role = params.roleLabel ?? "vetted professional";
  return [
    `Heads up before I quote "${params.title}": this goes to a ${role} through Terac, not to AI.`,
    `Real people work on a real schedule — expect hours, and sometimes a day or two, not minutes. You'll get every update in this thread.`,
    `Reply YES if that timeline works and I'll bring you the price, or STOP to cancel. Nothing is charged yet.`,
  ].join("\n");
}

/** Second gate: the timeline is accepted, this is the actual spend. */
export function expertPaymentConfirm(params: {
  title: string;
  quoteLine: string;
  numParticipants: number;
  roleLabel?: string;
}): string {
  const role = params.roleLabel ?? "vetted professional";
  const who = `${params.numParticipants} ${role}${params.numParticipants === 1 ? "" : "s"}`;
  return [
    `Timeline accepted. Here's the price for "${params.title}": ${params.quoteLine}`,
    `That hires ${who} on Terac. Funds are held in escrow and only released when you approve the work.`,
    `Reply YES once more to confirm the payment, or NO to hold.`,
  ].join("\n");
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
  return `${count} deliverable${count === 1 ? " is" : "s are"} ready. YES to accept and release payment, NO to reject. Billed on approval.`;
}

export function approvedWorkReply(payUrl: string, amountText?: string): string {
  const amount = amountText ? ` of ${amountText}` : "";
  return [
    `Accepted! Escrow${amount} held in your Cascade wallet.`,
    `Fund it here: ${payUrl}`,
  ].join("\n");
}

export function rejectedWorkReply(): string {
  return `Rejected — search stays live for the next deliverable.`;
}

export function paymentPendingReply(payUrl: string): string {
  return `Payment still pending: ${payUrl}`;
}

/**
 * A payment request someone can act on. Naming the asset is not enough — the
 * person needs the converted amount, the address it lands on, the network that
 * address lives on, and a link that opens the transaction for this job.
 */
export function escrowRequestReply(params: {
  title: string;
  quoteLine: string;
  destination: string;
  network: string;
  payUrl: string;
}): string {
  return [
    `To start "${params.title}", send ${params.quoteLine}`,
    `Network: ${params.network}`,
    `Escrow address: ${params.destination}`,
    `Pay here: ${params.payUrl}`,
    `Held in escrow — released to the worker only when you approve here.`,
  ].join("\n");
}

/** Confirms the switch and restates the request in the new asset. */
export function assetSwitchedReply(symbol: string): string {
  return `Switched to ${symbol} at the live rate.`;
}

export function approvalRecordedReply(): string {
  return `Approved.`;
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

export function fundedViaCreditsReply(title: string): string {
  return `Paid from your Cascade balance for "${title}". Matching you with workers now.`;
}

export function errorReply(): string {
  return `Hit a snag — nothing was launched or spent. Text again in a moment.`;
}

export function fallbackReply(): string {
  return `${BRAND.name} answers what it can for free and hires a real person for the rest — someone on the network, or a vetted Terac professional when the task needs a credential. Paid only when you approve. Text what you need done.`;
}

/** STOP before anything was funded — say plainly that no money moved. */
export function stoppedBeforeChargeReply(title: string): string {
  return `Stopped "${title}". Nothing was charged and nobody was hired. Text me whenever you want to start something new.`;
}

/** STOP with escrow held — name the amount and where it went. */
export function stoppedWithRefundReply(
  title: string,
  amountCents: number
): string {
  return [
    `Stopped "${title}". Nobody was paid.`,
    `Your ${formatCents(amountCents)} escrow is back in your Cascade balance — spend it on the next task or cash it out anytime.`,
  ].join("\n");
}

/**
 * The payout already left, or the job was already settled. Never imply money
 * is coming back when we cannot pull it back.
 */
export function stoppedAfterPayoutReply(): string {
  return `This one already settled and the worker was paid, so there's nothing left to stop. Nothing further will happen on it — text a new task whenever.`;
}

export function alreadyStoppedReply(): string {
  return `Already stopped — nothing is running. Text a new task whenever you're ready.`;
}

export function nothingRunningReply(): string {
  return `Nothing is running right now. Text me a task whenever you want one started.`;
}

/** Sent to the worker's own thread when the requester cancels. */
export function peerJobCancelledNotice(title: string): string {
  return `Heads up: "${title}" was cancelled by the requester, so no deliverable is needed. I'll ping you on the next one.`;
}

/** A worker dropping a job they claimed. */
export function peerDroppedJobReply(title: string): string {
  return `Dropped "${title}" — it's back in the pool for someone else. No hit to your rating.`;
}

export function accountLinkReply(url: string): string {
  return `Here's your ${BRAND.name} account — jobs, payments and wallet in one place:\n${url}\n\nThe link signs you in and expires in 30 minutes.`;
}

export function signupRequiredReply(url: string): string {
  return [
    `Welcome to ${BRAND.name}. Before I take on work I need an account behind this number — it's where your jobs, escrow and receipts live.`,
    `Set it up here (verifies this number, takes a few seconds):`,
    url,
    `Come straight back to this thread when you're done and I'll pick up your request.`,
  ].join("\n");
}

export function accountLinkUnavailableReply(): string {
  return `Can't open your ${BRAND.name} account right now. Everything still works here in the thread — text what you need done.`;
}

/** Shown once, on the first quote, so the web app is discoverable at all. */
export function accountLinkHint(): string {
  return `Reply LINK anytime to see your jobs and payments on the web.`;
}

export function alreadyHaveBalanceNudge(): string {
  return `You already have a Cascade wallet balance from work you\u2019ve delivered — pay from there in one tap.`;
}
