"use server";
import { getAuthHeaders } from "@/lib/session";
import { isRedirectError } from "next/dist/client/components/redirect";
import { getProfileVisibilityState } from "@/lib/utils/profilePrivacy";
import {
  profileLanguageRows,
  profileTopPostRows,
  type ProfileSectionResult,
} from "@/lib/utils/profile-sections";
import type { ILanguage, ITopPost } from "@/types/profile.types";

async function loadSection<T>(
  profileId: string,
  kind: "top" | "languages",
  parse: (value: unknown) => T[],
): Promise<ProfileSectionResult<T>> {
  const message =
    kind === "top"
      ? "Unable to load Top Posts. Please try again."
      : "Unable to load languages. Please try again.";
  if (!/^[a-f\d]{24}$/i.test(profileId))
    return { status: "400", response: [], message: "Invalid profile." };
  try {
    const headers = await getAuthHeaders();
    const read = async (path: string) => {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}${path}`,
        { headers, cache: "no-store", signal: AbortSignal.timeout(15000) },
      );
      const result = await response.json();
      if (!response.ok || result?.status !== "7400")
        throw new Error("Profile section request failed.");
      return result.response;
    };
    const viewer = await read("/user/");
    if (typeof viewer?._id !== "string" || !/^[a-f\d]{24}$/i.test(viewer._id))
      throw new Error("Invalid viewer.");
    const own = viewer._id === profileId;
    const profile = own ? viewer : await read(`/user/public/${profileId}`);
    if (profile?._id !== profileId) throw new Error("Invalid profile.");
    if (profile.isTalent !== true)
      return {
        status: "private",
        response: [],
        message: "Professional details are available on talent profiles.",
      };
    const visibility = getProfileVisibilityState(profile, own);
    if (
      !visibility.canViewProfile ||
      (kind === "top" && !visibility.canViewPosts)
    )
      return {
        status: "private",
        response: [],
        message: !visibility.canViewProfile
          ? "This user's profile details are private."
          : "This user's posts are private.",
      };
    const query = new URLSearchParams({
      viewUserId: viewer._id,
      userId: profileId,
      pageNo: "1",
      pageSize: "3",
    });
    const rows = await read(
      kind === "top"
        ? `/feeds/profile/best-work?${query}`
        : `/user/languages/${profileId}`,
    );
    return { status: "7400", response: parse(rows) };
  } catch (error) {
    if (isRedirectError(error)) throw error;
    return { status: "400", response: [], message };
  }
}
export async function getProfileTopPostsAction(
  profileId: string,
): Promise<ProfileSectionResult<ITopPost>> {
  return loadSection(profileId, "top", profileTopPostRows);
}
export async function getProfileLanguagesAction(
  profileId: string,
): Promise<ProfileSectionResult<ILanguage>> {
  return loadSection(profileId, "languages", profileLanguageRows);
}
