import * as z from "zod";

export const PostAboutValidation = z.object({
  title: z.string().min(5, { message: "Title is required" }).max(130),
  description: z.string().min(50),
  rating: z.number(),
  mainCategory: z.string().min(1, { message: "Main Category is required" }),
  subCategory: z.string().min(1, { message: "Sub Category is required" }),
  skills: z.string().min(1, { message: "Skills is required" }),
  skillLevel: z.string(),
  primaryLanguage: z.string(),
  secondaryLanguage: z.string(),
  country: z.string(),
  state: z.string(),
  tagPeople: z.string(),
  hashtag: z.string(),
});
