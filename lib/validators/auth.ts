import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(8).max(72),
});

export const registerSchema = z.object({
  fullName: z.string().trim().min(3).max(120),
  email: z.string().trim().email(),
  password: z.string().min(8).max(72),
  confirmPassword: z.string().min(8).max(72),
  accepted: z.literal("on"),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
