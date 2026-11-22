import { z } from "zod";
import { newPasswordValidation } from "./password.validation";

export const SignupValidation = z.object({
  username: z
    .string()
    .min(1, "Username is required")
    .min(4, "Username is too short")
    .max(30)
    .regex(
      /^[A-Za-z0-9_]{4,24}$/,
      "Username should be 4-24 characters and shouldn't include any special character!",
    )
    .trim(),
  email: z.string().min(1, "Email is required").email(),
  password: newPasswordValidation,
  acceptedPolicies: z
    .boolean()
    .refine(
      (value) => value === true,
      "Please read and accept the Terms and Conditions and Privacy Policy.",
    ),
});

export const signupRequestValidation = SignupValidation.omit({
  username: true,
}).extend({ userName: SignupValidation.shape.username });
