import * as z from "zod";

export const savedPostMediaValidation = z.object({
  mediaType: z.enum(["image", "video"]),
  url: z.string().url(),
  urlKey: z.string().nullish(),
  thumbnailUrl: z.string().nullish(),
  thumbnailUrlkey: z.string().nullish(),
});

export const savedThumbnailValidation = z.object({
  url: z.string().url(),
  urlKey: z.string().nullish(),
});

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
  z.enum(["beginner", "intermediate", "advanced"]).nullable(),
);

export const createPostShareValidation = z.object({
  media: z.array(
    z.object({
      mediaType: z.enum(["image", "video"]),
      croppedData: z.custom<File>().optional(),
      originalAsset: savedPostMediaValidation.optional(),
      croppedPrev: z.string().nullable(),
      thumbnail: z.custom<File>().optional(),
      thumbnailPreview: z.string().optional(),
    }),
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
    }),
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
        }),
      ),
    }),
  ),
  toolsUsed: z.array(
    z.object({
      toolName: z.string(),
      level: z.enum(["", "beginner", "intermediate", "advanced"]),
    }),
  ),
  // sharelink
  website: z.string().optional(),
  shareLinkThumbnail: z
    .union([
      z.custom<File>(
        (value) => typeof File !== "undefined" && value instanceof File,
      ),
      savedThumbnailValidation,
      z.string().url(),
    ])
    .nullish(),
});

// Existing mobile posts can have a short title or an empty description.
export const editPostShareValidation = createPostShareValidation.extend({
  title: z.string().trim().min(1, "Title is required").max(130),
  description: z.string().max(5000),
});
