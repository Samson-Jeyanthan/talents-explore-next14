"use server";
import { getAuthHeaders } from "@/lib/session";
import { isRedirectError } from "next/dist/client/components/redirect";
import { getProfileVisibilityState } from "@/lib/utils/profilePrivacy";
import {
  PROFILE_POST_PAGE_SIZE,
  profilePostRows,
  type ProfileFeedKind,
  type ProfilePostPage,
} from "@/lib/utils/profile-feed";

export async function getProfilePostPageAction(
  profileId: string,
  kind: ProfileFeedKind,
  page = 1,
): Promise<ProfilePostPage> {
  if (
    !/^[a-f\d]{24}$/i.test(profileId) ||
    !["all", "credit", "sharelink"].includes(kind) ||
    !Number.isSafeInteger(page) ||
    page < 1 ||
    page > 100000
  )
    return { status: "400", message: "Invalid profile posts request." };
  try {
    const headers = await getAuthHeaders();
    const read = async (path: string) => {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}${path}`,
        { headers, cache: "no-store", signal: AbortSignal.timeout(15000) },
      );
      const result = await response.json();
      if (!response.ok || result?.status !== "7400")
        throw new Error("Unable to load profile posts.");
      return result.response;
    };
    const viewer = await read("/user/");
    if (typeof viewer?._id !== "string" || !/^[a-f\d]{24}$/i.test(viewer._id))
      throw new Error("Unable to verify viewer.");
    const own = viewer._id === profileId;
    const profile = own ? viewer : await read(`/user/public/${profileId}`);
    if (profile?._id !== profileId)
      throw new Error("Unable to verify profile.");
    const visibility = getProfileVisibilityState(profile, own);
    if (
      !visibility.canViewProfile ||
      !(kind === "all"
        ? visibility.canViewPosts
        : kind === "sharelink"
          ? visibility.canViewSharedLinks
          : visibility.canViewSharedPosts)
    )
      return {
        status: "private",
        message: !visibility.canViewProfile
          ? "This user's profile details are private."
          : kind === "all"
            ? "This user's posts are private."
            : kind === "sharelink"
              ? "This user's shared links are unavailable."
              : "This user's shared posts are private.",
      };
    const query = new URLSearchParams({
      userId: profileId,
      viewUserId: viewer._id,
      pageNo: String(page),
      pageSize: String(PROFILE_POST_PAGE_SIZE),
    });
    const rows = await read(`/feeds/profile/${kind}?${query}`);
    return { status: "7400", response: profilePostRows(rows) };
  } catch (error) {
    if (isRedirectError(error)) throw error;
    return {
      status: "400",
      message: `Unable to load ${kind === "all" ? "posts" : kind === "sharelink" ? "shared links" : "credits"}. Please try again.`,
    };
  }
}
