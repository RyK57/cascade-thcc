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

/** GET /api/agent-wallet response. */
export const agentWalletResponseSchema = z.object({
  configured: z.boolean(),
  agentAddress: z.string().optional(),
  workerAddress: z.string().optional(),
  balances: z.record(z.string(), addressBalancesSchema),
});

/** GET /api/treasury/balances response (Mission Control canvas poll). */
export const treasuryBalancesResponseSchema = z.object({
  treasuryAddress: z.string(),
  agentWalletConfigured: z.boolean().optional(),
  agentAddress: z.string().nullable().optional(),
  balances: z.record(z.string(), addressBalancesSchema),
});

export type JobCheckoutResponse = z.infer<typeof jobCheckoutResponseSchema>;
export type AgentWalletResponse = z.infer<typeof agentWalletResponseSchema>;
export type TreasuryBalancesResponse = z.infer<
  typeof treasuryBalancesResponseSchema
>;
