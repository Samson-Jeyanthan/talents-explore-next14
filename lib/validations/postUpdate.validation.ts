import { z } from "zod";
import {
  savedPostMediaValidation,
  savedThumbnailValidation,
} from "./post.validation";

const id = z.string().regex(/^[a-f\d]{24}$/i);
const optionalId = id.nullable();
const level = z.enum(["beginner", "intermediate", "advanced"]);
export const postUpdateValidation = z
  .object({
    type: z.enum(["POST", "SHARELINK"]),
    media: z.array(savedPostMediaValidation).max(9),
    website: z.string().nullable().optional(),
    shareLinkThumbnail: savedThumbnailValidation
      .or(z.string().url())
      .nullable()
      .optional(),
    about: z.object({
      title: z.string().trim().min(1).max(130),
      description: z.string().max(5000),
      mainCategoryId: id,
      subCategoryId: id,
      skillId: optionalId,
      level: level.nullable(),
      primaryLanguage: id,
      secondaryLanguage: optionalId,
      ownRating: z.number().min(0).max(5),
      keywords: z.string(),
      country: z.string(),
      state: z.string(),
      peopleTag: z.array(id),
      productionName: z.string().nullable().optional(),
      productionDate: z.string().nullable().optional(),
    }),
    isCreditWork: z.boolean(),
    credit: z.array(
      z.object({ creditTitle: z.string(), peopleTag: z.array(id) }),
    ),
    toolsUsed: z.array(
      z.object({
        toolName: z.string(),
        level: level.or(z.literal("")).nullable(),
      }),
    ),
  })
  .superRefine((data, ctx) => {
    if (data.type === "POST" && data.media.length === 0)
      ctx.addIssue({
        code: "custom",
        path: ["media"],
        message: "Please add an image or video.",
      });
    if (data.type === "SHARELINK") {
      try {
        if (!["http:", "https:"].includes(new URL(data.website || "").protocol))
          throw new Error();
      } catch {
        ctx.addIssue({
          code: "custom",
          path: ["website"],
          message: "Please enter a valid HTTP or HTTPS link.",
        });
      }
      if (!data.shareLinkThumbnail)
        ctx.addIssue({
          code: "custom",
          path: ["shareLinkThumbnail"],
          message: "Please choose a thumbnail.",
        });
    }
  });
