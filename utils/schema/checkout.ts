import { z } from "zod";
import { jobSchema } from "./job";
import { paymentSchema } from "./payment";

/** GET /api/jobs/[jobId] response. */
export const jobCheckoutResponseSchema = z.object({
  job: jobSchema,
  payment: paymentSchema.nullable(),
});

export const addressBalancesSchema = z.object({
  eth: z.string(),
  usdc: z.string(),
});

/** GET /api/treasury/balances response. */
export const treasuryBalancesResponseSchema = z.object({
  treasuryAddress: z.string().optional(),
  balances: z.record(z.string(), addressBalancesSchema),
});

export type JobCheckoutResponse = z.infer<typeof jobCheckoutResponseSchema>;
export type TreasuryBalancesResponse = z.infer<typeof treasuryBalancesResponseSchema>;
