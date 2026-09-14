"use server";

import { revalidatePath } from "next/cache";
import { getAuthHeaders } from "@/lib/session";

export async function getFollowerList(
  userId: string | undefined,
  viewerId: string | undefined,
  pageNo: number,
  pageSize: number
) {
  try {
    const headers = await getAuthHeaders();
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_BACKEND_URL}/connect-user/followerList?userId=${userId}&viewerId=${viewerId}&pageNo=${pageNo}&pageSize=${pageSize}`,
      {
        cache: "no-store",
        headers,
      }
    );
    const res = await response.json();
    return res;
  } catch {}
}

export async function getFollowingList(
  userId: string | undefined,
  viewerId: string | undefined,
  pageNo: number,
  pageSize: number
) {
  try {
    const headers = await getAuthHeaders();
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_BACKEND_URL}/connect-user/followingList?userId=${userId}&viewerId=${viewerId}&pageNo=${pageNo}&pageSize=${pageSize}`,
      {
        cache: "no-store",
        headers,
      }
    );
    const res = await response.json();
    return res;
  } catch {}
}

export async function followUserAction(
  userId: string | undefined,
  followingId: string
) {
  const formData = {
    userId,
    followingId,
  };
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_BACKEND_URL}/connect-user/follow`,
      {
        method: "POST",
        cache: "no-store",
        headers: await getAuthHeaders(),
        body: JSON.stringify(formData),
      }
    );
    return await response.json();
  } catch (error) {
    console.error("Unable to follow user", error);
  }
}

export async function unFollowUserAction(
  userId: string | undefined,
  followingId: string
) {
  const formData = {
    userId,
    followingId,
  };
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_BACKEND_URL}/connect-user/unfollow`,
      {
        method: "POST",
        cache: "no-store",
        headers: await getAuthHeaders(),
        body: JSON.stringify(formData),
      }
    );
    return await response.json();
  } catch (error) {
    console.error("Unable to unfollow user", error);
  }
}

export async function getProfileRatingList(
  userId: string | undefined,
  pageNo: number,
  pageSize: number
) {
  try {
    const headers = await getAuthHeaders();
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_BACKEND_URL}/user/rating/list?userId=${userId}&pageNo=${pageNo}&pageSize=${pageSize}`,
      {
        cache: "no-store",
        headers,
      }
    );
    const res = await response.json();
    const data = res.response;
    return data;
  } catch {}
}

export async function getProfileOverallRating(userId: string | undefined) {
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_BACKEND_URL}/user/rating/splitup/${userId}`
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
  revalidatePathURL: string
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
      }
    );
    const res = await response.json();
    if (res.status === "7400") {
      revalidatePath(revalidatePathURL);
    }
    return res;
  } catch {}
}
