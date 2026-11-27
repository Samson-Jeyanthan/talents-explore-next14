import { z } from "zod";
import { getProfileLocationUpdate } from "./profileLocation";
import type { TCurrentUserData } from "@/types/profile.types";
import type { UploadedFile } from "./uploadFile";
import { validProfileBirthDate } from "./birth-date";

export { validProfileBirthDate } from "./birth-date";

export function profileImageError(file: unknown): string {
  if (typeof File === "undefined" || !(file instanceof File))
    return "Choose a valid image file.";
  const extensions: Record<string, RegExp> = {
    "image/jpeg": /\.jpe?g$/i,
    "image/png": /\.png$/i,
    "image/webp": /\.webp$/i,
  };
  if (!extensions[file.type]?.test(file.name))
    return "Choose a JPEG, PNG, or WebP image.";
  if (!file.size || file.size > 8 * 1024 * 1024)
    return "Images must be non-empty and no larger than 8 MB.";
  return "";
}
export const profileImageSelection = z
  .custom<File>(
    (file) => !profileImageError(file),
    "Choose a JPEG, PNG, or WebP image up to 8 MB.",
  )
  .nullable()
  .optional();

const httpUrl = z.string().refine((value) => {
  try {
    const url = new URL(value);
    return (
      ["https:", "http:"].includes(url.protocol) &&
      !url.username &&
      !url.password
    );
  } catch {
    return false;
  }
}, "Use a full http:// or https:// URL.");
export const profileEditPayloadValidation = z
  .object({
    firstName: z.string().trim().min(1).max(150),
    lastName: z.string().trim().min(1).max(150),
    dob: z
      .string()
      .refine(
        (value) => validProfileBirthDate(value),
        "Enter a valid date of birth. You must be at least 13.",
      ),
    gender: z.string().min(1).max(100),
    languageKnown: z.string().min(1).max(150),
    professional: z.string().min(1).max(150),
    shortBio: z.string().max(120),
    profileImage: z.union([httpUrl, z.literal("")]).optional(),
    coverImage: z.union([httpUrl, z.literal("")]).optional(),
    location: z.string().trim().min(1).optional(),
    latitude: z.number().finite().min(-90).max(90).optional(),
    longitude: z.number().finite().min(-180).max(180).optional(),
    moreInfo: z
      .object({
        bio: z.string().trim().max(1000),
        ethnic: z
          .string()
          .regex(/^[a-f\d]{24}$/i)
          .nullable()
          .optional(),
        featuredPhotos: z.array(httpUrl).max(3),
        socialLinks: z
          .array(
            z.object({
              type: z.string().min(1).max(100),
              url: z.union([httpUrl, z.literal("")]),
              show: z.boolean().optional(),
            }),
          )
          .max(50),
      })
      .or(
        z
          .object({
            ethnic: z
              .string()
              .regex(/^[a-f\d]{24}$/i)
              .nullable(),
          })
          .strict(),
      )
      .optional(),
  })
  .refine(
    (value) =>
      value.location === undefined
        ? value.latitude === undefined && value.longitude === undefined
        : value.latitude !== undefined && value.longitude !== undefined,
    "Choose a location with valid coordinates.",
  );

type EditValues = {
  firstName: string;
  lastName: string;
  dob: string;
  gender: string;
  knownLanguage: string;
  profession: string;
  quotes?: string;
  location: string;
  latitude?: number;
  longitude?: number;
  profilePhoto?: File | null;
  coverPhoto?: File | null;
  featuredPhotos?: File[];
  bio?: string;
  ethnic?: string;
  socialLinks?: { type: string; url?: string; show?: boolean }[];
};
export async function prepareProfileEditPayload(
  values: EditValues,
  user: TCurrentUserData,
  retainedPhotos: string[],
  upload: (file: File, prefix: string, userId: string) => Promise<UploadedFile>,
  cache: Map<File, UploadedFile>,
  active: () => boolean,
  ethnicDirty = false,
) {
  const files = [
    values.profilePhoto,
    values.coverPhoto,
    ...(user.isTalent ? values.featuredPhotos || [] : []),
  ].filter((file): file is File => file != null);
  for (const file of files) {
    const error = profileImageError(file);
    if (error) throw new Error(error);
  }
  if (
    user.isTalent &&
    retainedPhotos.length + (values.featuredPhotos?.length || 0) > 3
  )
    throw new Error("You can add up to 3 featured photos.");
  const payload: any = {
    ...getProfileLocationUpdate(user, values),
    firstName: values.firstName,
    lastName: values.lastName,
    dob: values.dob,
    gender: values.gender,
    languageKnown: values.knownLanguage,
    professional: values.profession,
    shortBio: values.quotes || "",
  };
  // Validate every text field before uploading any files.
  if (user.isTalent)
    payload.moreInfo = {
      bio: values.bio || "",
      featuredPhotos: retainedPhotos,
      socialLinks: (values.socialLinks || []).map((link) => ({
        ...link,
        url: link.url?.trim() || "",
      })),
      ...(values.ethnic || ethnicDirty
        ? { ethnic: values.ethnic || null }
        : {}),
    };
  else if (values.ethnic || ethnicDirty)
    payload.moreInfo = { ethnic: values.ethnic || null };
  const checked = profileEditPayloadValidation.safeParse(payload);
  if (!checked.success) throw new Error(checked.error.issues[0].message);
  const result = checked.data;
  const uploadCached = async (file: File, prefix: string) => {
    if (!active()) throw new Error("Profile editor closed.");
    let uploaded = cache.get(file);
    if (!uploaded) {
      uploaded = await upload(file, prefix, user._id);
      cache.set(file, uploaded);
    }
    if (!active()) throw new Error("Profile editor closed.");
    return uploaded.url;
  };
  if (values.profilePhoto !== undefined)
    result.profileImage =
      values.profilePhoto === null
        ? ""
        : await uploadCached(values.profilePhoto, "profile-pic");
  if (values.coverPhoto !== undefined)
    result.coverImage =
      values.coverPhoto === null
        ? ""
        : await uploadCached(values.coverPhoto, "cover-pic");
  if (result.moreInfo && "featuredPhotos" in result.moreInfo) {
    result.moreInfo.featuredPhotos = [...retainedPhotos];
    for (const file of values.featuredPhotos || [])
      result.moreInfo.featuredPhotos.push(
        await uploadCached(file, "featured-photo"),
      );
  }
  return result;
}
