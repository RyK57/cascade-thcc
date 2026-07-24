import { z } from "zod";

export const ledgerEntrySchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  deltaCredits: z.number().int(),
  jobId: z.string().uuid().optional(),
  reason: z.string().min(1),
  createdAt: z.string(),
});

export const createLedgerEntrySchema = ledgerEntrySchema.pick({
  userId: true,
  deltaCredits: true,
  jobId: true,
  reason: true,
});

export type LedgerEntry = z.infer<typeof ledgerEntrySchema>;
export type CreateLedgerEntryInput = z.infer<typeof createLedgerEntrySchema>;
