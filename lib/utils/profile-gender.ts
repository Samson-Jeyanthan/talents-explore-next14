import { z } from "zod";

// API values used by the mobile profile flow.
export const PROFILE_GENDER_VALUES = [
  "female",
  "male",
  "transmale",
  "transfemale",
  "nonconfirming",
  "nottosay",
  "notlistedadd",
] as const;
export const PROFILE_GENDER_OPTIONS = [
  { id: "female", name: "Female" },
  { id: "male", name: "Male" },
  { id: "transmale", name: "Trans Male" },
  { id: "transfemale", name: "Trans Female" },
  { id: "nonconfirming", name: "Gender Variant / Nonconforming" },
  { id: "nottosay", name: "Prefer not to say" },
  { id: "notlistedadd", name: "Not Listed Above" },
];

// Existing web profiles retain their saved values until the user changes them.
const legacy = [
  { id: "other", name: "Other (previous selection)" },
  { id: "prefferNotToSay", name: "Prefer not to say (previous selection)" },
];
export const profileGenderValidation = z.enum(
  [...PROFILE_GENDER_VALUES, "other", "prefferNotToSay"],
  { errorMap: () => ({ message: "Please select a valid gender." }) },
);
export function getProfileGenderOptions(saved: unknown) {
  return [
    ...PROFILE_GENDER_OPTIONS,
    ...legacy.filter((option) => option.id === saved),
  ];
}
