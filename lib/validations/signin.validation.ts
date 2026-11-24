import { z } from "zod";

export const SigninValidation = z.object({
  email: z.string().min(1, { message: "Email is required" }).email(),
  password: z.string().min(1, { message: "Password is required" }),
});

export const signinRequestValidation = SigninValidation.extend({
  deviceId: z.string().min(1).max(100).default("deviceId"),
  appVersion: z
    .string()
    .min(1)
    .max(100)
    .default("Application.nativeApplicationVersion"),
});

// Return display data to the browser, never the backend's full account record.
export const signinUserValidation = z.object({
  _id: z.string().regex(/^[a-f\d]{24}$/i),
  userName: z.string().min(1),
  email: z.string().email(),
  isTalent: z
    .boolean()
    .nullish()
    .transform((value) => value ?? false),
  personalInfo: z
    .object({
      firstName: z
        .string()
        .nullish()
        .transform((value) => value ?? ""),
      lastName: z
        .string()
        .nullish()
        .transform((value) => value ?? ""),
      profileImage: z
        .string()
        .nullish()
        .transform((value) => value ?? null),
    })
    .nullish()
    .transform(
      (value) => value ?? { firstName: "", lastName: "", profileImage: null },
    ),
});
