import { z } from "zod";

export const USER_ROLE = {
  requester: "requester",
  peer: "peer",
  both: "both",
} as const;

export const userRoleSchema = z.enum([
  USER_ROLE.requester,
  USER_ROLE.peer,
  USER_ROLE.both,
]);

export const userSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email().optional(),
  fullName: z.string().min(1).optional(),
  phone: z.string().min(1).optional(),
  role: userRoleSchema,
  creditBalance: z.number().int(),
  walletAddress: z.string().optional(),
  trustScore: z.number().int(),
  lastLat: z.number().optional(),
  lastLng: z.number().optional(),
  createdAt: z.string(),
});

export const createUserSchema = z.object({
  email: z.string().email().optional(),
  fullName: z.string().min(1).optional(),
  phone: z.string().min(1).optional(),
  role: userRoleSchema.optional(),
  creditBalance: z.number().int().optional(),
  walletAddress: z.string().optional(),
  trustScore: z.number().int().optional(),
  lastLat: z.number().optional(),
  lastLng: z.number().optional(),
});

export type User = z.infer<typeof userSchema>;
export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UserRole = z.infer<typeof userRoleSchema>;
