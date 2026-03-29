import * as z from "zod";

const optionalStringField = z.preprocess((value) => {
  if (value === "" || value === undefined) {
    return null;
  }
  return value;
}, z.string().nullable());

const optionalSkillLevelField = z.preprocess((value) => {
  if (value === "" || value === undefined) {
    return null;
  }
  return value;
}, z.enum(["beginner", "intermediate", "advanced"]).nullable());

export const PostAboutValidation = z.object({
  title: z.string().min(5, { message: "Title is required" }).max(130),
  description: z.string().min(50),
  rating: z.number(),
  mainCategory: z.string().min(1, { message: "Main Category is required" }),
  subCategory: z.string().min(1, { message: "Sub Category is required" }),
  skills: optionalStringField,
  skillLevel: optionalSkillLevelField,
  primaryLanguage: z.string(),
  secondaryLanguage: z.string(),
  country: z.string(),
  state: z.string(),
  tagPeople: z.array(z.string()),
  hashtag: z.string(),
  isCreditWork: z.boolean(),
  productionName: z.string(),
  credit: z.array(
    z.object({
      creditTitle: z.string(),
      peopleTag: z.array(z.string()),
    })
  ),
  toolsUsed: z.array(
    z.object({
      toolName: z.string(),
      level: z.enum(["", "beginner", "intermediate", "advanced"]),
    })
  ),
});
