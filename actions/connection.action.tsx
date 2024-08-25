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
    const data = res.response;
    console.log(data, "resdatacheck");
    return data;
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
    console.log(response, "resoponsen");
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
    console.log(response, "resoponsen");
    return response.data;
  } catch {}
}
