import * as z from "zod";
import { newPasswordValidation } from "./password.validation";
import { profileLocationSchema } from "../utils/profileLocation";
import { validProfileBirthDate } from "../utils/birth-date";

export { SignupValidation } from "./signup.validation";

export const SigninValidation = z.object({
  email: z.string().min(1, { message: "Email is required" }).email(),
  password: z.string().min(1, { message: "Password is required" }),
});

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

export const CompleteProfileValidation = z
  .object({
    ...profileLocationSchema.shape,
    firstName: z.string().min(1, { message: "First name is required" }).trim(),
    lastName: z.string().min(1, { message: "Last name is required" }).trim(),
    gender: z.string().min(1, { message: "Gender is required" }),
    knownLanguage: z.string().min(1, { message: "Known Language is required" }),
    profession: z.string().min(1, { message: "Profession is required" }),
    quotes: z.string().trim(),
    dob: z.string().min(1, { message: "Date of Birth is required" }),
    coverPhoto: z.custom<File>().optional(),
    profilePhoto: z.custom<File>().optional(),
  })
  .refine((data) => validProfileBirthDate(data.dob), {
    message: "You must be at least 13 years old",
    path: ["dob"],
  });

export { talentRegistrationValidation as TalentRegisterValidation } from "../utils/talent-registration";
