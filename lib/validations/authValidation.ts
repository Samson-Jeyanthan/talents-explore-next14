import * as z from "zod";

export const SignupValidation = z.object({
  username: z
    .string()
    .min(1, { message: "Username is required" })
    .min(4, { message: "Username is too short" })
    .max(30)
    .regex(/^[A-Za-z0-9_]{4,24}$/, {
      message:
        "Username should be 4-24 characters and shouldn't include any special character!",
    })
    .trim(),
  email: z.string().min(1, { message: "Email is required" }).email(),
  password: z
    .string()
    .min(1, { message: "Password is required" })
    .min(8, { message: "Password must be at least 8 characters" })
    .max(32, "The password must be a maximun 32 characters")
    .regex(
      /^(?=.*[0-9])(?=.*[a-zA-Z])(?=.*[!@#$%^&*])[a-zA-Z0-9!@#$%^&*]{8,32}$/,
      {
        message:
          "Password must have atleast 1 uppercase, 1 lowercase, 1 number and 1 special character",
      }
    ),
});

export const SigninValidation = z.object({
  email: z.string().min(1, { message: "Email is required" }).email(),
  password: z.string().min(1, { message: "Password is required" }),
});

export const ForgotPasswordValidation = z.object({
  email: z.string().min(1, { message: "Email is required" }).email(),
});

export const ResetPasswordValidation = z
  .object({
    password: z
      .string()
      .min(1, { message: "Password is required" })
      .min(8, { message: "Password must be at least 8 characters" })
      .max(32, "The password must be a maximun 32 characters")
      .regex(
        /^(?=.*[0-9])(?=.*[a-zA-Z])(?=.*[!@#$%^&*])[a-zA-Z0-9!@#$%^&*]{8,20}$/,
        {
          message:
            "Password must have atleast 1 uppercase, 1 lowercase, 1 number and 1 special character",
        }
      ),
    confirmPassword: z
      .string()
      .min(1, { message: "Confirm Password is required" }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export const CompleteProfileValidation = z.object({
  firstName: z.string().min(1, { message: "First name is required" }).trim(),
  lastName: z.string().min(1, { message: "Last name is required" }).trim(),
  gender: z.string().min(1, { message: "Gender is required" }),
  knownLanguage: z.string().min(1, { message: "Known Language is required" }),
  profession: z.string().min(1, { message: "Profession is required" }),
  quotes: z.string().trim(),
  // dob: z.string().min(1, { message: "Date of Birth is required" }).date(),
  coverPhoto: z.custom<File[]>().optional(),
  profilePhoto: z.custom<File[]>().optional(),
  year: z.string(),
  month: z.string(),
  day: z.string(),
});
