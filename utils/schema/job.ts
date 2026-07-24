import { z } from "zod";

export const JOB_STATUS = {
  intake: "intake",
  draftReady: "draft_ready",
  launched: "launched",
  inReview: "in_review",
  paymentPending: "payment_pending",
  paid: "paid",
  cancelled: "cancelled",
} as const;

export const jobStatusSchema = z.enum([
  JOB_STATUS.intake,
  JOB_STATUS.draftReady,
  JOB_STATUS.launched,
  JOB_STATUS.inReview,
  JOB_STATUS.paymentPending,
  JOB_STATUS.paid,
  JOB_STATUS.cancelled,
]);

export const jobSchema = z.object({
  id: z.string().uuid(),
  linqChatId: z.string().min(1),
  requesterHandle: z.string().min(1),
  title: z.string().min(1),
  description: z.string().optional(),
  status: jobStatusSchema,
  teracOpportunityId: z.string().optional(),
  teracSubmissionId: z.string().optional(),
  quotedTotalCents: z.number().int().nonnegative().optional(),
  quotedCurrency: z.string().optional(),
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
    teracOpportunityId: true,
    teracSubmissionId: true,
    quotedTotalCents: true,
    quotedCurrency: true,
  })
  .partial();

export type JobStatus = z.infer<typeof jobStatusSchema>;
export type Job = z.infer<typeof jobSchema>;
export type CreateJobInput = z.infer<typeof createJobSchema>;
export type UpdateJobInput = z.infer<typeof updateJobSchema>;
