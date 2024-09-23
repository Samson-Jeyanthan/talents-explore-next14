"use server";

import { SavedItemCard, SavedFolderCard } from "@/components/cards";
import { ISavedFolder, ISavedItem } from "@/types/post.types";
import { revalidatePath } from "next/cache";

export async function getAllSavedFoldersAction(
  userId: string | undefined,
  postId: string | number | undefined,
  returnAsCard: boolean
) {
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_BACKEND_URL}/collection/${userId}/${postId}`
    );
    const res = await response.json();
    if (res.status === "7400") {
      const data = res.response;
      if (returnAsCard) {
        const reversedList = data?.slice().reverse();
        return reversedList.map((item: ISavedFolder, index: number) => (
          <SavedFolderCard
            key={item._id}
            folderCard={item}
            userId={userId}
            index={index}
          />
        ));
      } else {
        const result = {
          status: 200,
          response: data,
        };
        return result;
      }
    } else {
      const data = {
        resStatus: 400,
        message: "Could not fetch all saved folders data",
      };
      return data;
    }
  } catch {}
}

export async function getSavedItemsByFolderIdAction(
  collectionId: string | undefined,
  userId: string | undefined,
  pageNo: number,
  pageSize: number,
  returnAsCard: boolean
) {
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_BACKEND_URL}/feeds/collection/${collectionId}?userId=${userId}&viewUserId=${userId}&pageNo=${pageNo}&pageSize=${pageSize}`
    );
    const res = await response.json();
    if (res.status === "7400") {
      const data = res.response;
      if (returnAsCard) {
        return data.map((item: ISavedItem, index: number) => (
          <SavedItemCard key={index} itemCard={item} index={index} />
        ));
      } else {
        return data;
      }
    } else {
      const data = {
        status: 400,
      };
      return data;
    }
  } catch {}
}

export async function createSaveCollectionFolderAction(
  userId: string,
  collectionName: string,
  revalidatePathURL: string
) {
  const formData = {
    userId,
    collectionName,
  };
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_BACKEND_URL}/collection`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      }
    );
    const res = await response.json();
    revalidatePath(revalidatePathURL);
    return res;
  } catch {}
}

export async function editSaveCollectionFolderAction(
  collectionId: string,
  collectionName: string,
  revalidatePathURL: string
) {
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_BACKEND_URL}/collection/${collectionId}/${collectionName}`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name: collectionName }),
      }
    );
    const res = await response.json();
    revalidatePath(revalidatePathURL);
    return res;
  } catch {}
}

export async function deleteSaveCollectionFolderAction(
  collectionId: string,
  revalidatePathURL: string
) {
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_BACKEND_URL}/collection/${collectionId}`,
      {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
    const res = await response.json();
    revalidatePath(revalidatePathURL);
    return res;
  } catch {}
}

export async function addPostToSaveCollectionAction(
  collectionId: string,
  postId: string
) {
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_BACKEND_URL}/collection/post/${collectionId}/${postId}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
    const res = await response.json();
    return res;
  } catch {}
}

export async function removeFromSaveCollectionAction(
  collectionId: string,
  postId: string
) {
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_BACKEND_URL}/collection/post/${collectionId}/${postId}`,
      {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
    const res = await response.json();
    return res;
  } catch {}
}
