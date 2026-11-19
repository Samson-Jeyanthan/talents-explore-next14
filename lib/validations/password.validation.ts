import { z } from "zod";

// Same rules as mobile's newPasswordSchema.
export const newPasswordValidation = z.string().regex(
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,20}$/,
  "Use 8–20 characters with uppercase and lowercase letters, a number, and a symbol (@ $ ! % * ? &). Spaces are not allowed."
);

export const resetPasswordRequestValidation = z.object({
  userId: z.string().trim().min(1),
  otp: z.string().trim().regex(/^\d{6}$/),
  newPassword: newPasswordValidation,
});
