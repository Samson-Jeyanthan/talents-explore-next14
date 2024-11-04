"use client";

import {
  addPostRating,
  followUserAction,
  getProfileOverallRating,
  unFollowUserAction,
} from "@/actions/connection.action";
import { toast } from "sonner";

export async function handleFollowUnFollow(
  isFollowed: number,
  userId: string | undefined,
  followingId: string,
  followingUserName: string,
  setIsFollowed: (value: number) => void
) {
  if (isFollowed === 1) {
    const res = await unFollowUserAction(userId, followingId);
    console.log(res);
    if (res?.status === "7400") {
      toast.info(`You are no longer follower of ${followingUserName}`, {
        duration: 4000,
      });
      setIsFollowed(0);
      return true;
    } else {
      toast.error("Something went wrong", {
        duration: 4000,
      });
      return false;
    }
  } else {
    const res = await followUserAction(userId, followingId);
    console.log(res);
    if (res?.status === "7400") {
      toast.success(`You are following ${followingUserName}`, {
        duration: 4000,
      });
      setIsFollowed(1);
      return true;
    } else {
      toast.error("Something went wrong", {
        duration: 4000,
      });
      return false;
    }
  }
}

export async function fetchProfileOverallRating(
  setOverallList: (value: any) => void,
  urlId: string,
  setIsOverallListLoading: (value: boolean) => void
) {
  const res = await getProfileOverallRating(urlId);
  if (res.status === "7400") {
    setOverallList(res.response);
    setIsOverallListLoading(false);
  }
}

export async function handleAddRating(
  userId: string | undefined,
  postId: string | undefined,
  authorId: string,
  ratingFor: "PROFILE" | "POST" | "SHARE" | "FILTER",
  rating: number,
  revalidatePathURL: string
) {
  let res: any = {};

  if (ratingFor === "POST") {
    res = await addPostRating(
      userId,
      postId,
      authorId,
      rating,
      revalidatePathURL
    );
  }
  console.log(res);
  if (res.status === "7400") {
    toast.success(
      `You have given ${rating} ⭐ to this ${
        ratingFor === "POST"
          ? " post"
          : ratingFor === "SHARE"
            ? " share"
            : " profile"
      }`,
      {
        duration: 4000,
      }
    );
  } else {
    toast.error("Something went wrong", { duration: 4000 });
  }
}
