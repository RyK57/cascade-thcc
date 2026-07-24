import { z } from "zod";
import { PAY_ASSET_VALUES } from "@/libs/dynamic/assets";

export const PAYMENT_STATUS = {
  pending: "payment_pending",
  walletConnected: "wallet_connected",
  authorized: "authorized",
  settled: "settled",
  failed: "failed",
  cancelled: "cancelled",
} as const;

export const paymentStatusSchema = z.enum([
  PAYMENT_STATUS.pending,
  PAYMENT_STATUS.walletConnected,
  PAYMENT_STATUS.authorized,
  PAYMENT_STATUS.settled,
  PAYMENT_STATUS.failed,
  PAYMENT_STATUS.cancelled,
]);

export const paymentSchema = z.object({
  id: z.string().uuid(),
  jobId: z.string().uuid(),
  teracSubmissionId: z.string().optional(),
  amountCents: z.number().int().positive(),
  currency: z.string().min(1),
  /** Settlement asset. USD stays the unit of account; this is what moves. */
  asset: z.enum(PAY_ASSET_VALUES).default("usdc"),
  status: paymentStatusSchema,
  dynamicWalletAddress: z.string().optional(),
  escrowTxHash: z.string().optional(),
  escrowHeldAt: z.string().optional(),
  escrowReleasedAt: z.string().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const createPaymentSchema = paymentSchema.pick({
  jobId: true,
  teracSubmissionId: true,
  amountCents: true,
  currency: true,
  asset: true,
});

export type PaymentStatus = z.infer<typeof paymentStatusSchema>;
export type Payment = z.infer<typeof paymentSchema>;
/** `z.input` so callers may omit `asset` and take the schema default. */
export type CreatePaymentInput = z.input<typeof createPaymentSchema>;
