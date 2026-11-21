import { z } from "zod";

export type SkillOption = { _id: string; name: string };
export type ProfileSkill = {
  _id?: string;
  id?: string;
  mainCategoryId: string;
  mainCategoryName?: string;
  subCategoryId: string;
  subCategoryName?: string;
  skillsHave: { skillId: string; skillName?: string; level: string }[];
  description: string;
  hashTags?: string[];
};
export const SKILL_LEVELS = ["beginner", "intermediate", "advanced"] as const;
const id = z
  .string()
  .regex(/^[a-f\d]{24}$/i, "Choose a valid category or skill.");
// Runtime construction preserves Unicode hashtags with the project's ES5 TypeScript target.
// eslint-disable-next-line prefer-regex-literals
const hashtagPattern = new RegExp("^#[\\p{L}\\p{M}\\p{N}_]+$", "u");
export const profileSkillValidation = z.object({
  mainCategoryId: id,
  subCategoryId: id,
  skillsHave: z
    .array(
      z.object({
        skillId: id,
        level: z.enum(SKILL_LEVELS),
      }),
    )
    .max(100)
    .refine(
      (rows) => new Set(rows.map((row) => row.skillId)).size === rows.length,
      "Choose each skill only once.",
    ),
  description: z.string().trim().min(1, "Description is required.").max(10000),
  hashTags: z
    .array(
      z
        .string()
        .trim()
        .max(100)
        .regex(hashtagPattern, "Use #hashtags separated by spaces or commas."),
    )
    .min(1, "Add at least one #hashtag.")
    .max(30),
});
export const profileSkillMutationValidation = z.object({
  profileId: id,
  skillSetId: z.string().min(1).max(20000).optional(),
  skill: profileSkillValidation,
});
export function parseSkillHashtags(value: string) {
  return Array.from(new Set(value.split(/[\s,]+/).filter(Boolean)));
}
export function skillSetKey(row?: ProfileSkill) {
  if (!row) return "";
  return (
    row._id ||
    row.id ||
    JSON.stringify([
      row.mainCategoryId,
      row.subCategoryId,
      row.skillsHave,
      row.description,
      row.hashTags || [],
    ])
  );
}
