import { z } from 'zod';

export const registerSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

export const loginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(1, 'Password is required'),
});

export const verifySchema = z.object({
  email: z.string().email('Invalid email format'),
  code: z.string().length(5, 'Verification code must be 5 digits').regex(/^\d{5}$/, 'Code must be numeric'),
});

export const resendCodeSchema = z.object({
  email: z.string().email('Invalid email format'),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type VerifyInput = z.infer<typeof verifySchema>;
export type ResendCodeInput = z.infer<typeof resendCodeSchema>;
