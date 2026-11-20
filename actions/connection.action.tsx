"use server";

import { revalidatePath } from "next/cache";
import { getAuthHeaders } from "@/lib/session";
import { resolveViewerIdAction } from "./tokenAndHeaders.action";
import { isRedirectError } from "next/dist/client/components/redirect";
import {
  connectionId,
  normalizeConnections,
  type ConnectionResult,
} from "@/lib/utils/connections";

async function connectionRequest(path: string, method = "GET", body?: object) {
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
        : "Unable to update connections. Please try again.";
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
      message: "Unable to reach connections. Please try again.",
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
) {
  try {
    const headers = await getAuthHeaders();
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_BACKEND_URL}/user/rating/list?userId=${userId}&pageNo=${pageNo}&pageSize=${pageSize}`,
      {
        cache: "no-store",
        headers,
      },
    );

    console.log("response", response);

    if (!response.ok) {
      throw new Error(`Failed to fetch ratings: ${response.status}`);
    }

    const res = await response.json();
    console.log("res", res);
    return res;
  } catch (error) {
    console.error("getProfileRatingList error:", error);
    throw error;
  }
}

export async function getProfileOverallRating(userId: string | undefined) {
  try {
    const headers = await getAuthHeaders();
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_BACKEND_URL}/user/rating/splitup/${userId}`,
      {
        cache: "no-store",
        headers,
      },
    );
    const res = await response.json();
    return res;
  } catch {}
}

export async function addPostRating(
  userId: string | undefined,
  postId: string | undefined,
  postOwnerId: string,
  rating: number,
  revalidatePathURL: string,
) {
  const formData = {
    userId,
    postId,
    postOwnerId,
    rating,
  };

  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_BACKEND_URL}/te-post/rating`,
      {
        method: "POST",
        headers: await getAuthHeaders(),
        body: JSON.stringify(formData),
      },
    );
    const res = await response.json();
    if (res.status === "7400") {
      revalidatePath(revalidatePathURL);
    }
    return res;
  } catch {}
}

export async function addProfileRatingAction(
  ratingUserId: string,
  rating: number,
  revalidatePathURL: string,
) {
  try {
    const formData = {
      ratingUserId,
      rating,
    };

    const response = await fetch(
      `${process.env.NEXT_PUBLIC_BACKEND_URL}/user/rating`,
      {
        method: "POST",
        headers: await getAuthHeaders(),
        body: JSON.stringify(formData),
      },
    );
    const res = await response.json();
    if (res.status === "7400") {
      revalidatePath(revalidatePathURL);
    }
    return res;
  } catch {}
}
