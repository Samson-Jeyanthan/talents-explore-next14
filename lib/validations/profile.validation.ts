import * as z from "zod";

export const languageValidation = z.object({
  languageId: z.string(),
  languageName: z.string().min(1, { message: "Language is required" }),
  languageLevel: z.string().min(1, { message: "Level is required" }),
});
