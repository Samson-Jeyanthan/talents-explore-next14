import { z } from "zod";

export type ProfileEducation = {
  _id?: string;
  id?: string;
  course: string;
  institution: string;
  from?: string | number | null;
  to?: string | number | null;
  [key: string]: unknown;
};

export function educationEndValue(value: ProfileEducation["to"]): string {
  if (value === null) return "present";
  return value === undefined ? "" : String(value).trim().toLowerCase();
}

export function educationKey(row?: ProfileEducation) {
  if (!row) return "";
  return (
    row._id ||
    row.id ||
    JSON.stringify([
      row.course,
      row.institution,
      String(row.from),
      String(row.to),
    ])
  );
}

const year = z
  .union([z.string(), z.number()])
  .transform(String)
  .refine(
    (value) =>
      /^\d{4}$/.test(value) &&
      Number(value) >= 1901 &&
      Number(value) <= new Date().getFullYear(),
    "Choose a valid year.",
  );
export const profileEducationValidation = z
  .object({
    course: z.string().trim().min(1, "Course name is required.").max(300),
    institution: z
      .string()
      .trim()
      .min(1, "Institution name is required.")
      .max(300),
    from: year,
    to: z.union([year, z.literal("present")]),
  })
  .refine(
    (value) => value.to === "present" || Number(value.to) >= Number(value.from),
    {
      path: ["to"],
      message: "End year must be the same as or after the start year.",
    },
  );

export const profileEducationMutationValidation = z.object({
  profileId: z.string().regex(/^[a-f\d]{24}$/i),
  educationId: z.string().min(1).max(4096).optional(),
  education: profileEducationValidation,
});
