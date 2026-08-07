import * as z from "zod";
import { formatISOStringDate } from "../hooks/useDateSelector";

export const languageValidation = z.object({
  languageId: z.string(),
  languageName: z.string().min(1, { message: "Language is required" }),
  languageLevel: z.string().min(1, { message: "Level is required" }),
});

// export const EditProfileValidation = z
//   .object({
//     firstName: z.string().min(1, { message: "First name is required" }).trim(),
//     lastName: z.string().min(1, { message: "Last name is required" }).trim(),
//     knownLanguage: z.string().min(1, { message: "Known Language is required" }),
//     profession: z.string().min(1, { message: "Profession is required" }),
//     dob: z.string().min(1, { message: "Date of Birth is required" }),
//     gender: z.string().min(1, { message: "Gender is required" }),
//     quotes: z.string().trim(),
//     coverPhoto: z.union([z.custom<File[]>(), z.string()]).optional(),
//     profilePhoto: z.union([z.custom<File[]>(), z.string()]).optional(),
//     // professional info for talents
//     bio: z.string().min(1, { message: "Bio is required" }).trim(),
//     ethnic: z.string().min(1, { message: "Ethnic is required" }),
//     featuredPhotos: z
//       .array(
//         z.custom<File>((file) => file instanceof File, {
//           message: "Expected a file",
//         })
//       )
//       .optional(),
//     socialLinks: z
//       .array(
//         z.object({
//           type: z.string(),
//           url: z.string(),
//         })
//       )
//       .optional(),
//   })
//   .refine(
//     (data) => {
//       const { dob } = data;
//       const { year, month, day } = formatISOStringDate(dob);
//       const refinedDob = new Date(Number(year), Number(month) - 1, Number(day));
//       const today = new Date();
//       const age = today.getFullYear() - refinedDob.getFullYear();
//       const isMonthPast = today.getMonth() - refinedDob.getMonth();
//       const isDayPast = today.getDate() - refinedDob.getDate();

//       // Calculate the exact age considering month and day
//       const exactAge =
//         isMonthPast > 0 || (isMonthPast === 0 && isDayPast >= 0)
//           ? age
//           : age - 1;

//       return exactAge >= 13;
//     },
//     {
//       message: "You must be at least 13 years old",
//       path: ["dob"],
//     }
//   );

const baseObjectSchema = z.object({
  firstName: z.string().min(1, { message: "First name is required" }).trim(),
  lastName: z.string().min(1, { message: "Last name is required" }).trim(),
  knownLanguage: z.string().min(1, { message: "Known Language is required" }),
  profession: z.string().min(1, { message: "Profession is required" }),
  dob: z.string().min(1, { message: "Date of Birth is required" }),
  gender: z.string().min(1, { message: "Gender is required" }),
  quotes: z.string().trim(),
  coverPhoto: z.union([z.custom<File[]>(), z.string()]).optional(),
  profilePhoto: z.union([z.custom<File[]>(), z.string()]).optional(),

  // professional info — required ONLY for talents, enforced via superRefine below
  bio: z.string().trim().optional(),
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
});

export const getEditProfileValidation = (isTalent: boolean) =>
  baseObjectSchema
    .superRefine((data, ctx) => {
      if (!isTalent) return;

      if (!data.bio || data.bio.trim().length === 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Bio is required",
          path: ["bio"],
        });
      }

      if (!data.ethnic || data.ethnic.trim().length === 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Ethnic is required",
          path: ["ethnic"],
        });
      }
    })
    .refine(
      (data) => {
        const { dob } = data;
        const { year, month, day } = formatISOStringDate(dob);
        const refinedDob = new Date(
          Number(year),
          Number(month) - 1,
          Number(day)
        );
        const today = new Date();
        const age = today.getFullYear() - refinedDob.getFullYear();
        const isMonthPast = today.getMonth() - refinedDob.getMonth();
        const isDayPast = today.getDate() - refinedDob.getDate();

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

// single stable type for the form — no ternary needed
export type EditProfileFormValues = z.infer<typeof baseObjectSchema>;
