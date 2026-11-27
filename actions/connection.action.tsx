"use server";

import { revalidatePath } from "next/cache";
import { getAuthHeaders } from "@/lib/session";
import { resolveViewerIdAction } from "./tokenAndHeaders.action";
import { isRedirectError } from "next/dist/client/components/redirect";
import {
  validRating,
  normalizeRatingSummary,
  normalizeRatingUsers,
  type RatingResult,
  type RatingUser,
  type RatingSummary,
} from "@/lib/utils/ratings";
import {
  connectionId,
  normalizeConnections,
  type ConnectionResult,
} from "@/lib/utils/connections";

async function connectionRequest(
  path: string,
  method = "GET",
  body?: object,
  resource = "connections",
) {
  try {
    const headers = await getAuthHeaders();
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_BACKEND_URL}${path}`,
      {
        headers,
        method,
        cache: "no-store",
        signal: AbortSignal.timeout(15000),
        ...(body ? { body: JSON.stringify(body) } : {}),
      },
    );
    const result = await response.json();
    if (response.ok && result?.status === "7400")
      return { ...result, status: "7400" };
    const message =
      typeof result?.message === "string"
        ? result.message
        : `Unable to update ${resource}. Please try again.`;
    return {
      status: response.ok ? 400 : response.status,
      message,
      restricted:
        response.status === 403 ||
        /privacy|private|restrict|permission|not allowed/i.test(message),
    };
  } catch (error) {
    if (isRedirectError(error)) throw error;
    return {
      status: 500,
      message: `Unable to reach ${resource}. Please try again.`,
    };
  }
}

async function readConnections(
  kind: "followerList" | "followingList",
  userId: string | undefined,
  pageNo: number,
  pageSize: number,
): Promise<ConnectionResult> {
  if (
    !connectionId(userId) ||
    !Number.isSafeInteger(pageNo) ||
    pageNo < 1 ||
    !Number.isInteger(pageSize) ||
    pageSize < 1 ||
    pageSize > 100
  )
    return { status: 400, message: "Invalid connection list request." };
  try {
    const viewerId = await resolveViewerIdAction();
    if (!viewerId) return { status: 401, message: "Please sign in again." };
    const result = await connectionRequest(
      `/connect-user/${kind}?userId=${userId}&viewerId=${encodeURIComponent(viewerId)}&pageNo=${pageNo}&pageSize=${pageSize}`,
    );
    if (result.status !== "7400")
      return {
        status: Number(result.status) || 500,
        message: result.message,
        restricted: result.restricted,
      };
    const items = normalizeConnections(result.response);
    return items
      ? {
          status: "7400",
          response: items,
          hasMore: result.response.length >= pageSize,
        }
      : { status: 500, message: "Unable to load this list. Please try again." };
  } catch (error) {
    if (isRedirectError(error)) throw error;
    return {
      status: 500,
      message: "Unable to load this list. Please try again.",
    };
  }
}
export async function getFollowerList(
  userId: string | undefined,
  _viewerId: string | undefined,
  pageNo: number,
  pageSize: number,
) {
  return readConnections("followerList", userId, pageNo, pageSize);
}
export async function getFollowingList(
  userId: string | undefined,
  _viewerId: string | undefined,
  pageNo: number,
  pageSize: number,
) {
  return readConnections("followingList", userId, pageNo, pageSize);
}
async function changeFollowing(followingId: string, follow: boolean) {
  if (!connectionId(followingId))
    return { status: 400, message: "Invalid account." };
  try {
    const viewerId = await resolveViewerIdAction();
    if (!viewerId) return { status: 401, message: "Please sign in again." };
    if (viewerId === followingId)
      return { status: 400, message: "You cannot follow your own account." };
    if (follow) {
      const profile = await connectionRequest(`/user/public/${followingId}`);
      if (profile.status !== "7400") return profile;
      if (
        profile.response?._id !== followingId ||
        profile.response.isTalent !== true
      )
        return { status: 403, message: "You can only follow talent profiles." };
    }
    const result = await connectionRequest(
      `/connect-user/${follow ? "follow" : "unfollow"}`,
      "POST",
      { followingId },
    );
    if (result.status === "7400")
      revalidatePath("/profile/[username]/[userId]", "layout");
    return result;
  } catch (error) {
    if (isRedirectError(error)) throw error;
    return {
      status: 500,
      message: "Unable to update this connection. Please try again.",
    };
  }
}
export async function followUserAction(
  followingId: string,
  _revalidatePathURL = "",
) {
  return changeFollowing(followingId, true);
}
export async function unFollowUserAction(
  followingId: string,
  _revalidatePathURL = "",
) {
  return changeFollowing(followingId, false);
}

export async function getProfileRatingList(
  userId: string | undefined,
  pageNo: number,
  pageSize: number,
): Promise<RatingResult<RatingUser[]>> {
  if (
    !connectionId(userId) ||
    !Number.isSafeInteger(pageNo) ||
    pageNo < 1 ||
    !Number.isInteger(pageSize) ||
    pageSize < 1 ||
    pageSize > 100
  )
    return { status: 400, message: "Invalid rating list request." };
  const result = await connectionRequest(
    `/user/rating/list?userId=${userId}&pageNo=${pageNo}&pageSize=${pageSize}`,
    "GET",
    undefined,
    "ratings",
  );
  if (result.status !== "7400") return result;
  const rows = normalizeRatingUsers(result.response);
  return rows
    ? { status: "7400", response: rows }
    : { status: 500, message: "Unable to load ratings. Please try again." };
}

export async function getProfileOverallRating(
  userId: string | undefined,
): Promise<RatingResult<RatingSummary>> {
  if (!connectionId(userId))
    return { status: 400, message: "Invalid profile." };
  const result = await connectionRequest(
    `/user/rating/splitup/${userId}`,
    "GET",
    undefined,
    "ratings",
  );
  if (result.status !== "7400") return result;
  const summary = normalizeRatingSummary(result.response);
  return summary
    ? { status: "7400", response: summary }
    : {
        status: 500,
        message: "Unable to load the rating summary. Please try again.",
      };
}

function invalidateRating(path: string, postId?: string) {
  revalidatePath("/profile/[username]/[userId]", "layout");
  if (postId) {
    revalidatePath(`/post/${postId}`);
    revalidatePath("/home");
    revalidatePath("/share-feed");
  }
  if (
    typeof path === "string" &&
    path.startsWith("/") &&
    !path.startsWith("//") &&
    !path.includes("\\")
  ) {
    const clean = path.split(/[?#]/)[0];
    if (
      clean &&
      clean !== "/home" &&
      clean !== "/share-feed" &&
      clean !== `/post/${postId}`
    )
      revalidatePath(clean);
  }
}

export async function addPostRating(
  _userId: string | undefined,
  postId: string | undefined,
  _postOwnerId: string,
  rating: number,
  revalidatePathURL: string,
) {
  if (!connectionId(postId) || !validRating(rating))
    return { status: 400, message: "Choose a rating from 1 to 5 stars." };
  try {
    const viewerId = await resolveViewerIdAction();
    if (!viewerId) return { status: 401, message: "Please sign in again." };
    const post = await connectionRequest(
      `/feeds/${postId}/${encodeURIComponent(viewerId)}`,
      "GET",
      undefined,
      "ratings",
    );
    if (post.status !== "7400") return post;
    const ownerId = post.response?.author?._id;
    if (!connectionId(ownerId) || post.response?._id !== postId)
      return {
        status: 500,
        message: "Unable to verify this post. Please try again.",
      };
    if (
      post.response?.permissions?.canRatePosts === false ||
      post.response?.permissions?.canRatePost === false
    )
      return { status: 403, message: "Ratings are restricted for this post." };
    const result = await connectionRequest(
      "/te-post/rating",
      "POST",
      { userId: viewerId, postId, postOwnerId: ownerId, rating },
      "ratings",
    );
    if (result.status === "7400") invalidateRating(revalidatePathURL, postId);
    return result;
  } catch (error) {
    if (isRedirectError(error)) throw error;
    return {
      status: 500,
      message: "Unable to save your rating. Please try again.",
    };
  }
}

export async function addProfileRatingAction(
  ratingUserId: string,
  rating: number,
  revalidatePathURL: string,
) {
  if (!connectionId(ratingUserId) || !validRating(rating))
    return { status: 400, message: "Choose a rating from 1 to 5 stars." };
  const profile = await connectionRequest(
    `/user/public/${ratingUserId}`,
    "GET",
    undefined,
    "ratings",
  );
  if (profile.status !== "7400") return profile;
  if (
    profile.response?._id !== ratingUserId ||
    profile.response.isTalent !== true
  )
    return {
      status: 403,
      message: "Only talent profiles can receive ratings.",
    };
  if (profile.response.permissions?.canRateProfile === false)
    return { status: 403, message: "Ratings are restricted for this profile." };
  const result = await connectionRequest(
    "/user/rating",
    "POST",
    { ratingUserId, rating },
    "ratings",
  );
  if (result.status === "7400") invalidateRating(revalidatePathURL);
  return result;
}
