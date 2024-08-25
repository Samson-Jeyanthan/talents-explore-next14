"use client";

import {
  followUserAction,
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
