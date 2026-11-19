"use server";

import { getAuthHeaders } from "@/lib/session";
import {
  REPORT_REASONS,
  reportValidation,
} from "@/lib/validations/report.validation";
import { isRedirectError } from "next/dist/client/components/redirect";

export async function submitReportAction(input: unknown) {
  const parsed = reportValidation.safeParse(input);
  if (!parsed.success)
    return { success: false, message: parsed.error.issues[0].message };
  const { targetId, targetType, reason, description } = parsed.data;
  const endpoint = {
    post: "post",
    profile: "user",
    collaboration: "collaboration",
  }[targetType];
  try {
    const headers = await getAuthHeaders();
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_BACKEND_URL}/report/${endpoint}/${targetId}`,
      {
        method: "POST",
        headers,
        cache: "no-store",
        signal: AbortSignal.timeout(15000),
        body: JSON.stringify({
          reason: REPORT_REASONS.find((item) => item.value === reason)!.label,
          description,
        }),
      },
    );
    const result = await response.json();
    if (response.ok && result?.status === "7400") {
      return {
        success: true,
        message:
          "Report submitted successfully. Thank you for helping us keep the community safe.",
      };
    }
    const message =
      typeof result?.message === "string"
        ? result.message
        : Array.isArray(result?.message)
          ? result.message
              .filter((item: unknown) => typeof item === "string")
              .join(". ")
          : "";
    return {
      success: false,
      message: message || "Unable to submit your report. Please try again.",
    };
  } catch (error) {
    if (isRedirectError(error)) throw error;
    return {
      success: false,
      message: "Unable to submit your report. Please try again.",
    };
  }
}
