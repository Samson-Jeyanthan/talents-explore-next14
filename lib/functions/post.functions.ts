"use client";

import {
  addPostCommentAction,
  addPostToBestWorkAction,
  removeFromBestWorkAction,
} from "@/actions/post.action";
import { toast } from "sonner";

export async function handlePinnedToProfile(
  userId: string,
  postId: string,
  revalidatePathURL: string
) {
  const res = await addPostToBestWorkAction(userId, postId, revalidatePathURL);
  console.log(res);
  if (res.status === "7400") {
    toast.success("Pinned to top posts", { duration: 4000 });
  } else {
    toast.error("Something went wrong", { duration: 4000 });
  }
}

export async function handleRemoveFromProfile(
  userId: string,
  postId: string,
  revalidatePathURL: string
) {
  const res = await removeFromBestWorkAction(userId, postId, revalidatePathURL);
  console.log(res);
  if (res.status === "7400") {
    toast.success("Removed from top posts", { duration: 4000 });
  } else {
    toast.error("Something went wrong", { duration: 4000 });
  }
}

export async function handleCommentSubmit(
  userId: string,
  postId: string,
  comment: string,
  revalidatePathURL: string
) {
  const res = await addPostCommentAction(
    userId,
    postId,
    comment,
    revalidatePathURL
  );
  console.log(res);
  if (res.status === "7400") {
    toast.success("You commented on this post", { duration: 4000 });
  } else {
    toast.error("Something went wrong", { duration: 4000 });
  }
}
