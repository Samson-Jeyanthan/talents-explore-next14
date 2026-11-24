import { z } from "zod";

const languageId = z
  .string()
  .regex(/^[a-f\d]{24}$/i, "Choose a valid language.");
const level = z.enum(["beginner", "intermediate", "advanced"], {
  errorMap: () => ({ message: "Choose a language level." }),
});
export const profileLanguageFormValidation = z.object({
  languageId,
  languageLevel: level,
});
export const profileLanguageMutationValidation = z.object({
  profileId: z.string().regex(/^[a-f\d]{24}$/i),
  entryId: z.string().min(1).max(4096).optional(),
  language: z.object({ languageId, level }),
});
