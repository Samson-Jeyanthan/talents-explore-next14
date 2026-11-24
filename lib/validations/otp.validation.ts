import { z } from "zod";
export const otpEmailValidation = z.string().trim().email();
export const passwordOtpRequestValidation = z.object({
  email: otpEmailValidation,
  otp: z.string().regex(/^\d{6}$/),
});
export const signupOtpRequestValidation = z.object({
  userId: z.string().regex(/^[a-f\d]{24}$/i),
  emailVerificationCode: z.number().int().min(0).max(999999),
  deviceId: z.string().min(1).max(100).default("web"),
  appVersion: z.string().min(1).max(100).default("web"),
});
