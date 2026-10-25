import * as z from "zod";

const optionalStringField = z.preprocess((value) => {
  if (value === "" || value === undefined) {
    return null;
  }
  return value;
}, z.string().nullable());

const optionalSkillLevelField = z.preprocess(
  (value) => {
    if (value === "" || value === undefined) {
      return null;
    }
    return value;
  },
  z.enum(["beginner", "intermediate", "advanced"]).nullable()
);

export const createPostShareValidation = z.object({
  media: z.array(
    z.object({
      mediaType: z.enum(["image", "video"]),
      croppedData: z.custom<File>(),
      croppedPrev: z.string().nullable(),
    })
  ),
  title: z.string().min(5, { message: "Title is required" }).max(130),
  description: z
    .string()
    .min(50, { message: "Description is required" })
    .max(5000),
  ownRating: z.number(),
  mainCategory: z.string().min(1, { message: "Main Category is required" }),
  subCategory: z.string().min(1, { message: "Sub Category is required" }),
  skill: optionalStringField,
  skillLevel: optionalSkillLevelField,
  primaryLanguage: z
    .string()
    .min(1, { message: "Primary Language is required" }),
  secondaryLanguage: z.string(),
  country: z.string(),
  state: z.string(),
  peopleTag: z.array(
    z.object({
      _id: z.string(),
      firstName: z.string(),
      lastName: z.string(),
      profileImage: z.string(),
    })
  ),
  keywords: z.string(),
  isCreditWork: z.string(),
  productionName: z.string().optional(),
  productionDate: z.string().optional(),
  credit: z.array(
    z.object({
      creditTitle: z.string(),
      peopleTag: z.array(
        z.object({
          _id: z.string(),
          firstName: z.string(),
          lastName: z.string(),
          profileImage: z.string(),
        })
      ),
    })
  ),
  toolsUsed: z.array(
    z.object({
      toolName: z.string(),
      level: z.enum(["", "beginner", "intermediate", "advanced"]),
    })
  ),
  // sharelink
  website: z.string().optional(),
  shareLinkThumbnail: z.custom<File>().optional(),
});
