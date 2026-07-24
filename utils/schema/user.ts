import { z } from "zod";

export const userSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  fullName: z.string().min(1).optional(),
  createdAt: z.string().datetime(),
});

export const createUserSchema = userSchema.pick({
  email: true,
  fullName: true,
});

export type User = z.infer<typeof userSchema>;
export type CreateUserInput = z.infer<typeof createUserSchema>;
