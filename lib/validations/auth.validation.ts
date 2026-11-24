import * as z from "zod";
import { newPasswordValidation } from "./password.validation";

export { SignupValidation } from "./signup.validation";

export { SigninValidation } from "./signin.validation";

export const ForgotPasswordValidation = z.object({
  email: z.string().min(1, { message: "Email is required" }).email(),
});

export const ResetPasswordValidation = z
  .object({
    password: newPasswordValidation,
    confirmPassword: z
      .string()
      .min(1, { message: "Confirm Password is required" }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export { completeProfileFormValidation as CompleteProfileValidation } from "./complete-profile.validation";

export { talentRegistrationValidation as TalentRegisterValidation } from "../utils/talent-registration";
