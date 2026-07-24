import { JOB_STATUS } from "@/utils/schema/job";
import { PAYMENT_STATUS } from "@/utils/schema/payment";

const JOB_STATUS_LABELS: Record<string, string> = {
  [JOB_STATUS.intake]: "Getting started",
  [JOB_STATUS.quoted]: "Quote ready",
  [JOB_STATUS.draftReady]: "Quote ready",
  [JOB_STATUS.paymentPending]: "Payment due",
  [JOB_STATUS.funded]: "Escrow held",
  [JOB_STATUS.claimed]: "In progress",
  [JOB_STATUS.delivered]: "Delivered — review in Messages",
  [JOB_STATUS.approved]: "Approved",
  [JOB_STATUS.launched]: "Expert work in progress",
  [JOB_STATUS.inReview]: "Under review",
  [JOB_STATUS.paid]: "Paid",
  [JOB_STATUS.cancelled]: "Cancelled",
};

const PAYMENT_STATUS_LABELS: Record<string, string> = {
  [PAYMENT_STATUS.pending]: "Payment due",
  [PAYMENT_STATUS.walletConnected]: "Wallet connected",
  [PAYMENT_STATUS.authorized]: "Escrow held",
  [PAYMENT_STATUS.settled]: "Paid",
  [PAYMENT_STATUS.failed]: "Payment failed",
  [PAYMENT_STATUS.cancelled]: "Cancelled",
};

const TIER_LABELS: Record<string, string> = {
  ai: "AI",
  peer: "Peer",
  expert: "Expert",
};

export function labelJobStatus(status: string): string {
  return JOB_STATUS_LABELS[status] ?? status.replaceAll("_", " ");
}

export function labelPaymentStatus(status: string): string {
  return PAYMENT_STATUS_LABELS[status] ?? status.replaceAll("_", " ");
}

export function labelJobTier(tier: string | undefined): string {
  if (!tier) return "—";
  return TIER_LABELS[tier] ?? tier;
}
