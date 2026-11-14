import * as z from "zod";
import { formatISOStringDate } from "../hooks/useDateSelector";

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

export const CompleteProfileValidation = z
  .object({
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
  .refine(
    (data) => {
      const { dob } = data;

      const { year, month, day } = formatISOStringDate(dob);
      const refinedDob = new Date(Number(year), Number(month) - 1, Number(day));
      const today = new Date();
      const age = today.getFullYear() - refinedDob.getFullYear();
      const isMonthPast = today.getMonth() - refinedDob.getMonth();
      const isDayPast = today.getDate() - refinedDob.getDate();

      console.log(dob, refinedDob, age);

      // Calculate the exact age considering month and day
      const exactAge =
        isMonthPast > 0 || (isMonthPast === 0 && isDayPast >= 0)
          ? age
          : age - 1;

      return exactAge >= 13;
    },
    {
      message: "You must be at least 13 years old",
      path: ["dob"],
    }
  );

export const TalentRegisterValidation = z.object({
  bio: z.string().min(1, { message: "Bio is required" }).trim(),
  ethnic: z.string().optional(),
  featuredPhotos: z
    .array(
      z.custom<File>((file) => file instanceof File, {
        message: "Expected a file",
      })
    )
    .optional(),
  socialLinks: z
    .array(
      z.object({
        type: z.string(),
        url: z.string(),
      })
    )
    .optional(),
  skillSets: z
    .array(
      z.object({
        mainCategory: z.string(),
        mainCategoryId: z.string(),
        subCategory: z.string(),
        subCategoryId: z.string(),
        skillsHave: z.array(
          z.object({
            skillId: z.string(),
            skill: z.string(),
            level: z.string(),
            // levelName: z.string()
          })
        ),
        description: z.string(),
        hashTags: z.array(z.string()),
      })
    )
    .optional(),
  languageKnown: z.array(
    z.object({
      languageId: z.string(),
      language: z.string(),
      level: z.string(),
    })
  ),
  education: z.array(
    z.object({
      course: z.string(),
      institution: z.string(),
      from: z.string(),
      to: z.string(),
    })
  ),
  awardsOrCertificate: z.array(
    z.object({
      name: z.string(),
      givenBy: z.string(),
      year: z.string(),
      certificate: z.custom<File>().optional(),
    })
  ),
  completeForm: z.boolean(),
});
