import * as z from "zod";

export const languageValidation = z.object({
  languageId: z.string(),
  languageName: z.string().min(1, { message: "Language is required" }),
  languageLevel: z.string().min(1, { message: "Level is required" }),
});

export const EditProfileValidation = z.object({
  firstName: z.string().min(1, { message: "First name is required" }).trim(),
  lastName: z.string().min(1, { message: "Last name is required" }).trim(),
  gender: z.string().min(1, { message: "Gender is required" }),
  knownLanguage: z.string().min(1, { message: "Known Language is required" }),
  profession: z.string().min(1, { message: "Profession is required" }),
  quotes: z.string().trim(),
  coverPhoto: z.union([z.custom<File[]>(), z.string()]).optional(),
  profilePhoto: z.union([z.custom<File[]>(), z.string()]).optional(),
  year: z.string(),
  month: z.string(),
  day: z.string(),
});
