"use client";

import {
  addPostRating,
  addProfileRatingAction,
  getProfileOverallRating,
} from "@/actions/connection.action";
import { toast } from "sonner";

export async function fetchProfileOverallRating(
  setOverallList: (value: any) => void,
  urlId: string,
  setIsOverallListLoading: (value: boolean) => void,
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
  ratingFor: "PROFILE" | "POST" | "SHARE",
  rating: number,
  revalidatePathURL: string,
) {
  let res: any = {};

  if (ratingFor === "POST" || ratingFor === "SHARE") {
    res = await addPostRating(
      userId,
      postId,
      authorId,
      rating,
      revalidatePathURL,
    );
  } else {
    res = await addProfileRatingAction(authorId, rating, revalidatePathURL);
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
      },
    );
  } else {
    toast.error("Something went wrong", { duration: 4000 });
  }
}
