"use server";

import SavedFolderCard from "@/components/cards/SavedFolderCard";
import { ISavedFolder } from "@/types/post.types";

export async function getAllSavedFoldersAction(
  userId: string | undefined,
  postId: string | number | undefined
) {
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_BACKEND_URL}/collection/${userId}/${postId}`
    );
    const res = await response.json();
    if (res.status === "7400") {
      const data = res.response;
      return data.map((Item: ISavedFolder, index: number) => (
        <SavedFolderCard
          key={Item._id}
          folderCard={Item}
          userId={userId}
          index={index}
        />
      ));
    } else {
      const data = {
        status: 400,
        message: "Could not fetch all saved folders data",
      };
      return data;
    }
  } catch {}
}

export async function getSavedFolderByIdAction(
  collectionId: string | undefined,
  userId: string | undefined,
  pageNo: number,
  pageSize: number
) {
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_BACKEND_URL}/feeds/collection/${collectionId}?userId=${userId}&viewUserId=${userId}&pageNo=${pageNo}&pageSize=${pageSize}`
    );
    const res = await response.json();
    if (res.status === "7400") {
      const data = res.response;
      return data;
    } else {
      const data = {
        status: 400,
      };
      return data;
    }
  } catch {}
}
