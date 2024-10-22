import * as z from "zod";

export const postFilterValidation = z.object({
  mainCategory: z.string(),
  subCategory: z.string(),
  skill: z.string(),
  level: z.string(),
  postRating: z.string(),
  postDescription: z.string(),
  primaryLanguage: z.string(),
  secondaryLanguage: z.string(),
  timeDuration: z.string(),
  country: z.string(),
  state: z.string(),
  creditTitle: z.string(),
});
