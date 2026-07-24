import { z } from "zod";

export const PAYOUT_STATUS = {
  simulated: "simulated",
  broadcast: "broadcast",
} as const;

export const payoutStatusSchema = z.enum([
  PAYOUT_STATUS.simulated,
  PAYOUT_STATUS.broadcast,
]);

export const payoutSchema = z.object({
  id: z.string().uuid(),
  jobId: z.string().uuid(),
  txHash: z.string().min(1),
  amountUsdcCents: z.number().int().nonnegative(),
  status: payoutStatusSchema,
  createdAt: z.string(),
});

export const createPayoutSchema = payoutSchema.pick({
  jobId: true,
  txHash: true,
  amountUsdcCents: true,
  status: true,
});

export type Payout = z.infer<typeof payoutSchema>;
export type CreatePayoutInput = z.infer<typeof createPayoutSchema>;
export type PayoutStatus = z.infer<typeof payoutStatusSchema>;
