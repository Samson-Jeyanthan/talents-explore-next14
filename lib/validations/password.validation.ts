import { z } from "zod";

// Preserve the previous password policy, adding # to its allowed symbols.
export const newPasswordValidation = z
  .string()
  .min(1, "Password is required")
  .regex(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])[A-Za-z\d@$!%*?&#]{8,20}$/,
    "Use 8–20 characters with uppercase and lowercase letters, a number, and a symbol (@ $ ! % * ? & #). Spaces, emoji, and Unicode characters are not allowed.",
  );

export const changePasswordRequestValidation = z.object({
  oldPassword: z.string().min(1, "Current password is required"),
  newPassword: newPasswordValidation,
});

export const resetPasswordRequestValidation = z.object({
  userId: z.string().trim().min(1),
  otp: z
    .string()
    .trim()
    .regex(/^\d{6}$/),
  newPassword: newPasswordValidation,
});
