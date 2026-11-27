"use server";
import { getAuthHeaders } from "@/lib/session";
import { revalidatePath } from "next/cache";
import { isRedirectError } from "next/dist/client/components/redirect";
import {
  awardKey,
  certificateUrl,
  profileAwardMutationValidation,
  type ProfileAward,
} from "@/lib/utils/profile-awards";

type AwardResult =
  | { status: "7400"; response: ProfileAward[]; message?: string }
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
async function readAwards(
  profileId: string,
  headers: Record<string, string>,
): Promise<ProfileAward[]> {
  const rows = await request(`/user/awardsOrCertificate/${profileId}`, headers);
  if (
    !Array.isArray(rows) ||
    rows.some(
      (row) =>
        !row ||
        typeof row !== "object" ||
        Array.isArray(row) ||
        typeof row.name !== "string" ||
        typeof row.givenBy !== "string" ||
        !["number", "string"].includes(typeof row.year),
    )
  )
    throw new Error("Invalid awards response");
  return rows;
}
export async function getProfileAwardsAction(
  profileId: string,
): Promise<AwardResult> {
  if (!/^[a-f\d]{24}$/i.test(profileId))
    return { status: "400", response: [], message: "Invalid profile." };
  try {
    return {
      status: "7400",
      response: await readAwards(profileId, await getAuthHeaders()),
    };
  } catch (error) {
    if (isRedirectError(error)) throw error;
    return {
      status: "400",
      response: [],
      message: "Unable to load awards and certificates. Please try again.",
    };
  }
}
async function updateAwards(
  profileId: string,
  awardId: string | undefined,
  award: ProfileAward | undefined,
): Promise<AwardResult> {
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
        message: "You can only update your own awards.",
      };
    const rows = await readAwards(profileId, headers);
    const matches = awardId
      ? rows.filter((row) => awardKey(row) === awardId)
      : [];
    if (awardId && !award && matches.length === 0) {
      return {
        status: "7400",
        response: rows,
        message: "Award already deleted.",
      };
    }
    if (awardId && matches.length !== 1)
      return {
        status: "400",
        response: [],
        message:
          "This award has changed or no longer exists. Refresh your profile and try again.",
      };
    if (
      !awardId &&
      award &&
      rows.some(
        (row) =>
          row.name === award.name &&
          row.givenBy === award.givenBy &&
          Number(row.year) === award.year &&
          certificateUrl(row) === award.certificateUrl,
      )
    ) {
      return {
        status: "7400",
        response: rows,
        message: "Award already saved.",
      };
    }
    const next = awardId
      ? rows.flatMap((row) =>
          awardKey(row) === awardId
            ? award
              ? [{ ...row, ...award }]
              : []
            : [row],
        )
      : [...rows, award!];
    await request("/user/awardsOrCertificate", headers, next);
    // A cache refresh failure must not turn an acknowledged save into a retry.
    try {
      revalidatePath("/profile/[username]/[userId]", "layout");
    } catch {}
    return {
      status: "7400",
      response: next,
      message: awardId
        ? award
          ? "Award updated."
          : "Award deleted."
        : "Award added.",
    };
  } catch (error) {
    if (isRedirectError(error)) throw error;
    return {
      status: "400",
      response: [],
      message:
        "Unable to save awards. Your information has been retained; please try again.",
    };
  }
}
export async function saveProfileAwardAction(
  payload: unknown,
): Promise<AwardResult> {
  const parsed = profileAwardMutationValidation.safeParse(payload);
  if (!parsed.success)
    return {
      status: "400",
      response: [],
      message: "Check the award name, issuer, year and certificate file.",
    };
  return updateAwards(
    parsed.data.profileId,
    parsed.data.awardId,
    parsed.data.award,
  );
}
export async function deleteProfileAwardAction(
  profileId: string,
  awardId: string,
): Promise<AwardResult> {
  if (
    !/^[a-f\d]{24}$/i.test(profileId) ||
    typeof awardId !== "string" ||
    !awardId ||
    awardId.length > 4096
  )
    return { status: "400", response: [], message: "Invalid award." };
  return updateAwards(profileId, awardId, undefined);
}
