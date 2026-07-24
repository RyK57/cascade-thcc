import { z } from "zod";

/**
 * Why a challenge was issued. `pay` challenges carry a job and land on that
 * job's checkout; `link` challenges land on the account home.
 */
export const ACCOUNT_LINK_PURPOSE = {
  link: "link",
  pay: "pay",
} as const;

export const accountLinkPurposeSchema = z.enum([
  ACCOUNT_LINK_PURPOSE.link,
  ACCOUNT_LINK_PURPOSE.pay,
]);

export const accountLinkSchema = z.object({
  id: z.string().uuid(),
  phone: z.string().min(1),
  userId: z.string().uuid().optional(),
  jobId: z.string().uuid().optional(),
  purpose: accountLinkPurposeSchema,
  expiresAt: z.string(),
  consumedAt: z.string().optional(),
  attempts: z.number().int().nonnegative(),
  createdAt: z.string(),
});

export const accountSessionSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  phone: z.string().min(1),
  expiresAt: z.string(),
  revokedAt: z.string().optional(),
  lastSeenAt: z.string(),
  createdAt: z.string(),
});

export type AccountLinkPurpose = z.infer<typeof accountLinkPurposeSchema>;
export type AccountLink = z.infer<typeof accountLinkSchema>;
export type AccountSession = z.infer<typeof accountSessionSchema>;
