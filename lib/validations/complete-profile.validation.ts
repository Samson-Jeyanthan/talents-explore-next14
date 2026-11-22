import { z } from "zod";
import { validProfileBirthDate } from "../utils/birth-date";
import { profileLocationSchema } from "../utils/profileLocation";
import { profileImageSelection } from "../utils/profile-editor";

const optionId = (label: string) =>
  z
    .string()
    .trim()
    .regex(/^[a-f\d]{24}$/i, `Please select a valid ${label}.`);
const shortBio = z
  .string()
  .trim()
  .max(120, "Quotes must be 120 characters or fewer.")
  .default("");
const personalFields = {
  ...profileLocationSchema.shape,
  firstName: z
    .string()
    .trim()
    .min(1, "First name is required.")
    .max(150, "First name must be 150 characters or fewer."),
  lastName: z
    .string()
    .trim()
    .min(1, "Last name is required.")
    .max(150, "Last name must be 150 characters or fewer."),
  // Preserve the API's existing spelling for Prefer not to say.
  gender: z.enum(["male", "female", "other", "prefferNotToSay"], {
    errorMap: () => ({ message: "Please select a valid gender." }),
  }),
  dob: z
    .string()
    .trim()
    .min(1, "Date of birth is required.")
    .refine(
      validProfileBirthDate,
      "Enter a valid date of birth. You must be at least 13 years old.",
    ),
};

export const completeProfileFormValidation = z.object({
  ...personalFields,
  knownLanguage: optionId("native language"),
  profession: optionId("profession"),
  quotes: shortBio,
  coverPhoto: profileImageSelection,
  profilePhoto: profileImageSelection,
});

const photoUrl = z
  .string()
  .trim()
  .refine((value) => {
    if (value === "") return true;
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
  }, "Use a valid http:// or https:// photo URL.")
  .nullable()
  .optional();

export const completeProfilePayloadValidation = z.object({
  ...personalFields,
  languageKnown: optionId("native language"),
  professional: optionId("profession"),
  shortBio,
  profileImage: photoUrl,
  coverImage: photoUrl,
});
