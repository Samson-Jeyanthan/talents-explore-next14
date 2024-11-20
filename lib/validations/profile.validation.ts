import * as z from "zod";

export const languageValidation = z.object({
  languageId: z.string(),
  languageName: z.string().min(1, { message: "Language is required" }),
  languageLevel: z.string().min(1, { message: "Level is required" }),
});

export const EditProfileValidation = z
  .object({
    firstName: z.string().min(1, { message: "First name is required" }).trim(),
    lastName: z.string().min(1, { message: "Last name is required" }).trim(),
    gender: z.string().min(1, { message: "Gender is required" }),
    knownLanguage: z.string().min(1, { message: "Known Language is required" }),
    profession: z.string().min(1, { message: "Profession is required" }),
    quotes: z.string().trim(),
    coverPhoto: z.union([z.custom<File[]>(), z.string()]).optional(),
    profilePhoto: z.union([z.custom<File[]>(), z.string()]).optional(),
    year: z.string(),
    month: z.string(),
    day: z.string(),
    // professional info for talents
    bio: z.string().min(1, { message: "Bio is required" }).trim(),
    ethnic: z.string().min(1, { message: "Ethnic is required" }).trim(),
    featuredPhotos: z.array(z.string()).optional(),
    socialLinks: z.array(
      z.object({
        type: z.string(),
        url: z.string(),
        show: z.boolean(),
      })
    ),
  })
  .refine(
    (data) => {
      const { year, month, day } = data;
      return !!year && !!month && !!day;
    },
    {
      message: "Date of Birth is required",
      path: ["year"],
    }
  )
  .refine(
    (data) => {
      const { year, month, day } = data;
      const dob = new Date(Number(year), Number(month) - 1, Number(day));
      const today = new Date();
      const age = today.getFullYear() - dob.getFullYear();
      const isMonthPast = today.getMonth() - dob.getMonth();
      const isDayPast = today.getDate() - dob.getDate();

      // Calculate the exact age considering month and day
      const exactAge =
        isMonthPast > 0 || (isMonthPast === 0 && isDayPast >= 0)
          ? age
          : age - 1;

      return exactAge >= 13;
    },
    {
      message: "You must be at least 13 years old",
      path: ["year"],
    }
  );
