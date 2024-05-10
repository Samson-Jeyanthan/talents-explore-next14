import * as z from "zod";

export const SignupValidation = z.object({
  username: z
    .string()
    .min(1, { message: "Username is required" })
    .min(2, { message: "Username is too short" })
    .max(50),
  email: z.string().min(1, { message: "Email is required" }).email(),
  password: z
    .string()
    .min(1, { message: "Password is required" })
    .min(8, { message: "Password must be at least 8 characters" }),
});

export const SigninValidation = z.object({
  email: z.string().min(1, { message: "Email is required" }).email(),
  password: z
    .string()
    .min(1, { message: "Password is required" })
    .min(8, { message: "Password must be at least 8 characters" }),
});

export const CompleteProfileValidation = z.object({
  firstName: z.string().min(1, { message: "First name is required" }),
  lastName: z.string().min(1, { message: "Last name is required" }),
  knownLanguage: z.string().min(1, { message: "Known Language is required" }),
  profession: z.string().min(1, { message: "Profession is required" }),
  quotes: z.string(),
});
