import { z } from "zod";
import { profileImageError } from "./profile-editor";
import { profileEducationValidation } from "./profile-education";
import { certificateFileError } from "./profile-awards";
import { profileSkillValidation, SKILL_LEVELS } from "./profile-skills";
import type { UploadedFile } from "./uploadFile";

const id = z.string().regex(/^[a-f\d]{24}$/i, "Choose a valid option.");
const url = z
  .string()
  .url()
  .refine(
    (value) => /^https?:\/\//i.test(value),
    "Use a full http:// or https:// URL.",
  );
const socialLinks = z
  .array(
    z.object({
      type: z.string().trim().min(1),
      url: z
        .string()
        .trim()
        .pipe(z.union([url, z.literal("")])),
      show: z.boolean().optional(),
    }),
  )
  .max(50);
const bio = z.string().trim().min(1, "Bio is required.").max(1000);
const ethnic = z.union([id, z.literal("")]).optional();
const awardYear = z
  .string()
  .refine(
    (value) =>
      /^\d{4}$/.test(value) &&
      Number(value) >= 1000 &&
      Number(value) <= new Date().getFullYear(),
    "Choose a valid award year.",
  );
export const registrationAwardValidation = z.object({
  name: z.string().trim().min(1, "Enter the award name."),
  givenBy: z.string().trim().min(1, "Enter the issuing authority."),
  year: awardYear,
  certificate: z
    .custom<
      File | string | null | undefined
    >((value) => value == null || (typeof value === "string" ? url.safeParse(value).success : typeof File !== "undefined" && value instanceof File && !certificateFileError(value)), "Choose a valid certificate up to 20 MB.")
    .optional(),
});
export const registrationSkillValidation = profileSkillValidation.extend({
  mainCategory: z.string().optional().default(""),
  subCategory: z.string().optional().default(""),
  skillsHave: z
    .array(
      z.object({
        skillId: id,
        skill: z.string().optional().default(""),
        level: z.enum(SKILL_LEVELS),
      }),
    )
    .max(100)
    .refine(
      (rows) => new Set(rows.map((row) => row.skillId)).size === rows.length,
      "Choose each skill only once.",
    ),
});
const languages = z
  .array(
    z.object({
      languageId: id,
      language: z.string().optional().default(""),
      level: z.enum(SKILL_LEVELS),
    }),
  )
  .min(1, "Add at least one language.")
  .max(100)
  .refine(
    (rows) => new Set(rows.map((row) => row.languageId)).size === rows.length,
    "Add each language only once.",
  );
export const talentRegistrationValidation = z.object({
  bio,
  ethnic,
  featuredPhotos: z
    .array(
      z.custom<File>(
        (file) => !profileImageError(file),
        "Choose a JPEG, PNG, or WebP image up to 8 MB.",
      ),
    )
    .max(3)
    .optional(),
  socialLinks: socialLinks.optional(),
  skillSets: z
    .array(registrationSkillValidation)
    .min(1, "Add at least one skill set.")
    .max(100),
  languageKnown: languages,
  education: z.array(profileEducationValidation).max(100),
  awardsOrCertificate: z.array(registrationAwardValidation).max(100),
  completeForm: z.boolean(),
});
export const talentRegistrationPayloadValidation = z.object({
  moreInfo: z.object({
    bio,
    ethnic: id.nullable(),
    featuredPhotos: z.array(url).max(3),
    socialLinks,
  }),
  skillSets: z.array(profileSkillValidation).min(1).max(100),
  languageKnown: languages.transform((rows) =>
    rows.map(({ languageId, level }) => ({ languageId, level })),
  ),
  education: z
    .array(
      z
        .object({
          course: z.string().trim().min(1),
          institution: z.string().trim().min(1),
          from: z.number().int().min(1901).max(new Date().getFullYear()),
          to: z
            .number()
            .int()
            .min(1901)
            .max(new Date().getFullYear())
            .nullable(),
        })
        .refine(
          (row) => row.to === null || row.to >= row.from,
          "End year must follow the start year.",
        ),
    )
    .max(100),
  awardsOrCertificate: z
    .array(
      z.object({
        name: z.string().trim().min(1),
        givenBy: z.string().trim().min(1),
        year: z.number().int().min(1000).max(new Date().getFullYear()),
        certificateUrl: url.optional(),
        certificateUrlKey: z.string().optional(),
      }),
    )
    .max(100),
});
export async function prepareTalentRegistration(
  values: unknown,
  userId: string,
  upload: (file: File, prefix: string, userId: string) => Promise<UploadedFile>,
  cache: Map<File, UploadedFile>,
  active: () => boolean,
) {
  const parsed = talentRegistrationValidation.parse(values);
  if (!parsed.completeForm)
    throw new Error(
      "Please agree to the terms before creating your talent profile.",
    );
  if (!id.safeParse(userId).success)
    throw new Error("Your account is not ready. Please reload and try again.");
  const uploadCached = async (file: File, prefix: string) => {
    if (!active()) throw new Error("Registration closed.");
    let result = cache.get(file);
    if (!result) {
      result = await upload(file, prefix, userId);
      cache.set(file, result);
    }
    if (!active()) throw new Error("Registration closed.");
    return result;
  };
  const featuredPhotos: string[] = [];
  for (const file of parsed.featuredPhotos || [])
    featuredPhotos.push((await uploadCached(file, "featured-photo")).url);
  const awardsOrCertificate = [];
  for (const award of parsed.awardsOrCertificate) {
    const uploaded =
      award.certificate && typeof award.certificate !== "string"
        ? await uploadCached(award.certificate, "award-certificate")
        : undefined;
    awardsOrCertificate.push({
      name: award.name,
      givenBy: award.givenBy,
      year: Number(award.year),
      ...(uploaded
        ? { certificateUrl: uploaded.url, certificateUrlKey: uploaded.key }
        : typeof award.certificate === "string"
          ? { certificateUrl: award.certificate }
          : {}),
    });
  }
  return talentRegistrationPayloadValidation.parse({
    moreInfo: {
      bio: parsed.bio,
      ethnic: parsed.ethnic || null,
      featuredPhotos,
      socialLinks: parsed.socialLinks || [],
    },
    skillSets: parsed.skillSets.map((set) => ({
      mainCategoryId: set.mainCategoryId,
      subCategoryId: set.subCategoryId,
      skillsHave: set.skillsHave.map(({ skillId, level }) => ({
        skillId,
        level,
      })),
      description: set.description,
      hashTags: set.hashTags,
    })),
    languageKnown: parsed.languageKnown,
    education: parsed.education.map((row) => ({
      ...row,
      from: Number(row.from),
      to: row.to === "present" ? null : Number(row.to),
    })),
    awardsOrCertificate,
  });
}
