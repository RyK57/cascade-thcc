import type { Payment, PaymentStatus } from "@/utils/schema/payment";

export interface PaymentRow {
  id: string;
  job_id: string;
  terac_submission_id: string | null;
  amount_cents: number;
  currency: string;
  status: string;
  dynamic_wallet_address: string | null;
  escrow_tx_hash: string | null;
  created_at: string;
  updated_at: string;
}

export const PAYMENT_ROW_COLUMNS =
  "id, job_id, terac_submission_id, amount_cents, currency, status, dynamic_wallet_address, escrow_tx_hash, created_at, updated_at";

export function mapPaymentRow(row: PaymentRow): Payment {
  return {
    id: row.id,
    jobId: row.job_id,
    teracSubmissionId: row.terac_submission_id ?? undefined,
    amountCents: row.amount_cents,
    currency: row.currency,
    status: row.status as PaymentStatus,
    dynamicWalletAddress: row.dynamic_wallet_address ?? undefined,
    escrowTxHash: row.escrow_tx_hash ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
