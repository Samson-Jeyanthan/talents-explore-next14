import { z } from "zod";

export type ProfileAward = {
  _id?: string;
  id?: string;
  name: string;
  givenBy: string;
  year: number;
  certificateUrl?: any;
  certificateUrlKey?: string;
  fileKey?: string;
  [key: string]: any;
};
const text = (value: any) => (typeof value === "string" ? value.trim() : "");
const bucket = "https://te-files-media.s3.eu-west-2.amazonaws.com/";
export function certificateUrl(award: any): string {
  const raw = [
    award?.certificateUrl?.uri,
    award?.certificateUrl?.url,
    award?.certificateUrl,
    award?.certificateUrlKey,
    award?.fileKey,
  ]
    .map(text)
    .find(Boolean);
  if (!raw) return "";
  const value = /^(te-files-media\.s3\.|s3\.)/i.test(raw)
    ? `https://${raw}`
    : raw;
  if (/^https?:\/\//i.test(value)) {
    try {
      const url = new URL(value);
      if (url.username || url.password) return "";
      const key = text(award?.certificateUrlKey) || text(award?.fileKey);
      if (
        /_image%3a\d+$/i.test(key) &&
        !/[?#]/.test(url.href) &&
        url.href.endsWith(key.replace(/^\/+/, ""))
      )
        return url.href.replace(
          /_(image%3a\d+)$/i,
          (_match, identifier: string) => `_${encodeURIComponent(identifier)}`,
        );
      return url.href;
    } catch {
      return "";
    }
  }
  if (/^[a-z][a-z\d+.-]*:/i.test(value) || value.startsWith("//")) return "";
  return (
    bucket +
    value.replace(/^\/+/, "").split("/").map(encodeURIComponent).join("/")
  );
}
export function certificateName(value: any): string {
  if (typeof File !== "undefined" && value instanceof File) return value.name;
  const key =
    text(value?.certificateUrlKey) ||
    text(value?.fileKey) ||
    certificateUrl(value) ||
    text(value);
  const name = key.split(/[?#]/)[0].split("/").pop() || "Certificate";
  try {
    return decodeURIComponent(name);
  } catch {
    return name;
  }
}
export function awardKey(award: any): string {
  const id = text(award?._id) || text(award?.id);
  return (
    id ||
    `legacy:${JSON.stringify([award?.name, award?.givenBy, award?.year, award?.certificateUrlKey || certificateUrl(award)])}`
  );
}
export function certificateFileError(
  file: Pick<File, "name" | "size" | "type">,
): string {
  if (!file.size) return "Choose a non-empty certificate file.";
  if (file.size > 20 * 1024 * 1024) return "Choose a certificate up to 20 MB.";
  const extensions: Record<string, string[]> = {
    pdf: ["application/pdf"],
    docx: [
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ],
    jpg: ["image/jpeg"],
    jpeg: ["image/jpeg"],
    png: ["image/png"],
    webp: ["image/webp"],
    gif: ["image/gif"],
  };
  const extension = file.name.split(".").pop()?.toLowerCase() || "";
  if (
    !extensions[extension] ||
    (file.type && !extensions[extension].includes(file.type))
  )
    return "Choose a PDF, DOCX, JPG, PNG, WebP, or GIF certificate.";
  return "";
}
export const profileAwardValidation = z.object({
  name: z.string().trim().min(1, "Enter the award or certificate name."),
  givenBy: z.string().trim().min(1, "Enter the issuing authority."),
  year: z.coerce
    .number()
    .int()
    .min(1000, "Choose a valid year.")
    .max(new Date().getFullYear(), "The award year cannot be in the future."),
  certificateUrl: z
    .string()
    .url()
    .refine(
      (value) => /^https?:\/\//i.test(value),
      "Choose a valid certificate file.",
    ),
  certificateUrlKey: z.string().optional().default(""),
});
export const profileAwardMutationValidation = z.object({
  profileId: z.string().regex(/^[a-f\d]{24}$/i),
  awardId: z.string().min(1).max(4096).optional(),
  award: profileAwardValidation,
});
