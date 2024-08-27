"use server";

import axiosInstance from "@/lib/config/axiosInstance";

export async function getFollowerList(
  userId: string | undefined,
  viewerId: string | undefined,
  pageNo: number,
  pageSize: number
) {
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_BACKEND_URL}/connect-user/followerList?userId=${userId}&viewerId=${viewerId}&pageNo=${pageNo}&pageSize=${pageSize}`
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
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_BACKEND_URL}/connect-user/followingList?userId=${userId}&viewerId=${viewerId}&pageNo=${pageNo}&pageSize=${pageSize}`
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
    const response = await axiosInstance.post("/connect-user/follow", formData);
    console.log("response follow");
    console.log(response.data);
    return response.data;
  } catch {}
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
    const response = await axiosInstance.post(
      "/connect-user/unfollow",
      formData
    );
    console.log("response unfollow");
    console.log(response.data);
    return response.data;
  } catch {}
}

export async function getProfileRatingList(
  userId: string | undefined,
  pageNo: number,
  pageSize: number
) {
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_BACKEND_URL}/user/rating/list?userId=${userId}&pageNo=${pageNo}&pageSize=${pageSize}`
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
