import { z } from "zod";

// IDs are UI values; the API accepts the labels used by mobile.
export const REPORT_REASONS = [
  { value: "1", label: "Nudity or sexual content" },
  { value: "2", label: "Hate speech or symbols" },
  { value: "3", label: "Harassment or bullying" },
  { value: "4", label: "Violence or graphic content" },
  { value: "5", label: "Self-harm or suicide content" },
  { value: "6", label: "Child exploitation" },
  { value: "7", label: "Spam or misleading content" },
  { value: "8", label: "Scams or fraud" },
  { value: "9", label: "Fake news or false information" },
  { value: "10", label: "Impersonation" },
  { value: "11", label: "Copyright infringement" },
  { value: "12", label: "Promotes illegal activities" },
  { value: "13", label: "Drug or substance abuse" },
  { value: "14", label: "Terrorism or extremist content" },
  { value: "15", label: "Other (please specify)" },
] as const;

export const reportValidation = z.object({
  targetType: z.enum(["post", "profile", "collaboration"]),
  targetId: z.string().regex(/^[a-f\d]{24}$/i, "Unable to identify this item."),
  reason: z
    .string()
    .refine(
      (value) => REPORT_REASONS.some((reason) => reason.value === value),
      "Please select a reason for reporting.",
    ),
  description: z
    .string()
    .trim()
    .min(1, "Please provide details about the problem."),
});

export type ReportTargetType = z.infer<typeof reportValidation>["targetType"];
