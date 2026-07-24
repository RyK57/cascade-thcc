import { z } from "zod";
import { TIER_VALUES } from "./agent";

export const JOB_STATUS = {
  intake: "intake",
  quoted: "quoted",
  funded: "funded",
  claimed: "claimed",
  delivered: "delivered",
  approved: "approved",
  launched: "launched",
  inReview: "in_review",
  paymentPending: "payment_pending",
  paid: "paid",
  cancelled: "cancelled",
  /** @deprecated Use `quoted`. Kept for reading legacy rows mid-migration. */
  draftReady: "draft_ready",
} as const;

export const jobStatusSchema = z.enum([
  JOB_STATUS.intake,
  JOB_STATUS.quoted,
  JOB_STATUS.funded,
  JOB_STATUS.claimed,
  JOB_STATUS.delivered,
  JOB_STATUS.approved,
  JOB_STATUS.launched,
  JOB_STATUS.inReview,
  JOB_STATUS.paymentPending,
  JOB_STATUS.paid,
  JOB_STATUS.cancelled,
  JOB_STATUS.draftReady,
]);

export const FUNDED_VIA = {
  wallet: "wallet",
  credits: "credits",
  agentpay: "agentpay",
} as const;

export const fundedViaSchema = z.enum([
  FUNDED_VIA.wallet,
  FUNDED_VIA.credits,
  FUNDED_VIA.agentpay,
]);

export const jobTierSchema = z.enum(TIER_VALUES);

export const jobSchema = z.object({
  id: z.string().uuid(),
  linqChatId: z.string().min(1),
  requesterHandle: z.string().min(1),
  title: z.string().min(1),
  description: z.string().optional(),
  status: jobStatusSchema,
  tier: jobTierSchema.optional(),
  teracOpportunityId: z.string().optional(),
  teracSubmissionId: z.string().optional(),
  teracTaskUrl: z.string().optional(),
  quotedTotalCents: z.number().int().nonnegative().optional(),
  quotedCurrency: z.string().optional(),
  priceUsdCents: z.number().int().nonnegative().optional(),
  assigneeUserId: z.string().uuid().optional(),
  statusCardMessageId: z.string().optional(),
  statusCardIsRich: z.boolean().optional(),
  fundedVia: fundedViaSchema.optional(),
  claimChatId: z.string().optional(),
  triageReason: z.string().optional(),
  evSummary: z.string().optional(),
  walletRefuseCount: z.number().int().nonnegative().optional(),
  requesterLat: z.number().optional(),
  requesterLng: z.number().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const createJobSchema = jobSchema.pick({
  linqChatId: true,
  requesterHandle: true,
  title: true,
  description: true,
});

export const updateJobSchema = jobSchema
  .pick({
    status: true,
    title: true,
    description: true,
    tier: true,
    teracOpportunityId: true,
    teracSubmissionId: true,
    teracTaskUrl: true,
    quotedTotalCents: true,
    quotedCurrency: true,
    priceUsdCents: true,
    assigneeUserId: true,
    statusCardMessageId: true,
    statusCardIsRich: true,
    fundedVia: true,
    claimChatId: true,
    triageReason: true,
    evSummary: true,
    walletRefuseCount: true,
    requesterLat: true,
    requesterLng: true,
  })
  .partial();

export type JobStatus = z.infer<typeof jobStatusSchema>;
export type Job = z.infer<typeof jobSchema>;
export type CreateJobInput = z.infer<typeof createJobSchema>;
export type UpdateJobInput = z.infer<typeof updateJobSchema>;
export type FundedVia = z.infer<typeof fundedViaSchema>;
