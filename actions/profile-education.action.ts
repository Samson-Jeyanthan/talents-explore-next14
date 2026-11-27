"use server";
import { getAuthHeaders } from "@/lib/session";
import { revalidatePath } from "next/cache";
import { isRedirectError } from "next/dist/client/components/redirect";
import {
  educationKey,
  profileEducationMutationValidation,
  type ProfileEducation,
} from "@/lib/utils/profile-education";

type EducationResult =
  | { status: "7400"; response: ProfileEducation[]; message?: string }
  | { status: "400"; response: []; message: string };
async function request(
  path: string,
  headers: Record<string, string>,
  body?: any,
) {
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_BACKEND_URL}${path}`,
    {
      method: body === undefined ? "GET" : "PUT",
      headers: { ...headers, "Content-Type": "application/json" },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
      cache: "no-store",
      signal: AbortSignal.timeout(15000),
    },
  );
  const data = await response.json();
  if (!response.ok || data?.status !== "7400")
    throw new Error("Request failed");
  return data.response;
}
async function readEducations(
  profileId: string,
  headers: Record<string, string>,
): Promise<ProfileEducation[]> {
  const rows = await request(`/user/educations/${profileId}`, headers);
  if (
    !Array.isArray(rows) ||
    rows.some(
      (row) =>
        !row ||
        typeof row !== "object" ||
        Array.isArray(row) ||
        typeof row.course !== "string" ||
        typeof row.institution !== "string" ||
        (row.from != null && !["number", "string"].includes(typeof row.from)) ||
        (row.to != null && !["number", "string"].includes(typeof row.to)),
    )
  )
    throw new Error("Invalid educations response");
  return rows;
}
export async function getProfileEducationsAction(
  profileId: string,
): Promise<EducationResult> {
  if (!/^[a-f\d]{24}$/i.test(profileId))
    return { status: "400", response: [], message: "Invalid profile." };
  try {
    return {
      status: "7400",
      response: await readEducations(profileId, await getAuthHeaders()),
    };
  } catch (error) {
    if (isRedirectError(error)) throw error;
    return {
      status: "400",
      response: [],
      message: "Unable to load education details. Please try again.",
    };
  }
}
async function updateEducations(
  profileId: string,
  educationId: string | undefined,
  education: ProfileEducation | undefined,
): Promise<EducationResult> {
  try {
    const headers = await getAuthHeaders();
    const viewer = await request("/user/", headers);
    if (viewer?.isTalent !== true)
      throw new Error(
        "Become a talent to manage professional profile details.",
      );
    if (viewer?._id !== profileId)
      return {
        status: "400",
        response: [],
        message: "You can only update your own education details.",
      };
    const rows = await readEducations(profileId, headers);
    const matches = educationId
      ? rows.filter((row) => educationKey(row) === educationId)
      : [];
    if (educationId && !education && matches.length === 0) {
      return {
        status: "7400",
        response: rows,
        message: "Education already deleted.",
      };
    }
    if (educationId && matches.length !== 1)
      return {
        status: "400",
        response: [],
        message:
          "This education has changed or no longer exists. Refresh your profile and try again.",
      };
    if (
      !educationId &&
      education &&
      rows.some(
        (row) =>
          row.course === education.course &&
          row.institution === education.institution &&
          String(row.from) === String(education.from) &&
          String(row.to) === String(education.to),
      )
    ) {
      return {
        status: "7400",
        response: rows,
        message: "Education already saved.",
      };
    }
    const next = educationId
      ? rows.flatMap((row) =>
          educationKey(row) === educationId
            ? education
              ? [{ ...row, ...education }]
              : []
            : [row],
        )
      : [...rows, education!];
    await request("/user/educations", headers, next);
    // A cache refresh failure must not turn an acknowledged save into a retry.
    try {
      revalidatePath("/profile/[username]/[userId]", "layout");
    } catch {}
    return {
      status: "7400",
      response: next,
      message: educationId
        ? education
          ? "Education updated."
          : "Education deleted."
        : "Education added.",
    };
  } catch (error) {
    if (isRedirectError(error)) throw error;
    return {
      status: "400",
      response: [],
      message:
        "Unable to save education details. Your information has been retained; please try again.",
    };
  }
}
export async function saveProfileEducationAction(
  payload: unknown,
): Promise<EducationResult> {
  const parsed = profileEducationMutationValidation.safeParse(payload);
  if (!parsed.success)
    return {
      status: "400",
      response: [],
      message: "Check the course, institution, and education dates.",
    };
  return updateEducations(
    parsed.data.profileId,
    parsed.data.educationId,
    parsed.data.education,
  );
}
export async function deleteProfileEducationAction(
  profileId: string,
  educationId: string,
): Promise<EducationResult> {
  if (
    !/^[a-f\d]{24}$/i.test(profileId) ||
    typeof educationId !== "string" ||
    !educationId ||
    educationId.length > 4096
  )
    return { status: "400", response: [], message: "Invalid education." };
  return updateEducations(profileId, educationId, undefined);
}
