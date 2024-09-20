"use client";

import {
  addPostCommentAction,
  addPostToBestWorkAction,
  removeFromBestWorkAction,
} from "@/actions/post.action";
import {
  createSaveCollectionFolderAction,
  deleteSaveCollectionFolderAction,
  editSaveCollectionFolderAction,
} from "@/actions/save.action";
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
  if (res.status === "7400") {
    toast.success("You commented on this post", { duration: 4000 });
  } else {
    toast.error("Something went wrong", { duration: 4000 });
  }
}

export async function handleCreateSaveCollection(
  userId: string,
  collectionName: string,
  revalidatePathURL: string
) {
  const res = await createSaveCollectionFolderAction(
    userId,
    collectionName,
    revalidatePathURL
  );
  if (res.status === "7400") {
    toast.success("Folder created successfully", { duration: 4000 });
  } else {
    toast.error("Something went wrong", { duration: 4000 });
  }
}

export async function handleEditSaveCollection(
  collectionId: string,
  collectionName: string,
  revalidatePathURL: string
) {
  const res = await editSaveCollectionFolderAction(
    collectionId,
    collectionName,
    revalidatePathURL
  );
  if (res.status === "7400") {
    toast.success("Folder renamed successfully", { duration: 4000 });
  } else {
    toast.error("Something went wrong", { duration: 4000 });
  }
}

export async function handleDeleteSaveCollection(collectionId: string) {
  const res = await deleteSaveCollectionFolderAction(
    collectionId,
    "/saved-collection"
  );
  console.log(res);
  if (res.status === "7400") {
    toast.success("Folder deleted successfully", { duration: 4000 });
  } else {
    toast.error("Something went wrong", { duration: 4000 });
  }
}
