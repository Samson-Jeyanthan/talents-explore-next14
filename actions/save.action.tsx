"use server";

import SavedItemCard from "@/components/cards/SavedItemCard";
import SavedFolderCard from "@/components/cards/SavedFolderCard";
import type { ISavedFolder, ISavedItem } from "@/types/post.types";
import { revalidatePath } from "next/cache";
import { getAuthHeaders } from "@/lib/session";
import { resolveViewerIdAction } from "./tokenAndHeaders.action";
import { isRedirectError } from "next/dist/client/components/redirect";
import {
  isCollectionId,
  collectionName,
  normalizeSavedFolders,
} from "@/lib/utils/savedCollections";

type ReadResult<T> =
  | { success: true; data: T }
  | { success: false; message: string };
async function request(path: string, method = "GET", body?: object) {
  try {
    const headers = await getAuthHeaders();
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_BACKEND_URL}${path}`,
      {
        method,
        headers,
        cache: "no-store",
        signal: AbortSignal.timeout(15000),
        ...(body ? { body: JSON.stringify(body) } : {}),
      },
    );
    const result = await response.json();
    if (response.ok && result?.status === "7400")
      return { ...result, status: "7400" };
    return {
      status: response.ok ? result?.status || 400 : response.status,
      message:
        typeof result?.message === "string"
          ? result.message
          : "Unable to update saved collections. Please try again.",
    };
  } catch (error) {
    if (isRedirectError(error)) throw error;
    return {
      status: 500,
      message: "Unable to reach saved collections. Please try again.",
    };
  }
}
function invalidate(folderId?: string, path?: string) {
  revalidatePath("/saved-collection");
  if (folderId) revalidatePath(`/saved-collection/${folderId}`);
  if (path && path !== "/saved-collection") revalidatePath(path);
}

export async function getSavedFoldersAction(
  postId: string | number = 0,
): Promise<ReadResult<ISavedFolder[]>> {
  if (postId !== 0 && postId !== 1 && !isCollectionId(postId))
    return { success: false, message: "Invalid post." };
  try {
    const viewerId = await resolveViewerIdAction();
    if (!viewerId)
      return {
        success: false,
        message: "Unable to identify your account. Please sign in again.",
      };
    const result = await request(`/collection/${viewerId}/${postId}`);
    const folders =
      result.status === "7400" ? normalizeSavedFolders(result.response) : null;
    return folders
      ? { success: true, data: folders }
      : {
          success: false,
          message:
            result.message ||
            "Unable to load saved collections. Please try again.",
        };
  } catch (error) {
    if (isRedirectError(error)) throw error;
    return {
      success: false,
      message: "Unable to load saved collections. Please try again.",
    };
  }
}

export async function getSavedItemsAction(
  folderId: string | undefined,
  pageNo = 1,
  pageSize = 20,
): Promise<ReadResult<ISavedItem[]>> {
  if (
    !isCollectionId(folderId) ||
    !Number.isSafeInteger(pageNo) ||
    pageNo < 1 ||
    !Number.isInteger(pageSize) ||
    pageSize < 1 ||
    pageSize > 100
  )
    return { success: false, message: "Invalid collection request." };
  try {
    const viewerId = await resolveViewerIdAction();
    if (!viewerId)
      return {
        success: false,
        message: "Unable to identify your account. Please sign in again.",
      };
    const result = await request(
      `/feeds/collection/${folderId}?userId=${viewerId}&viewUserId=${viewerId}&pageNo=${pageNo}&pageSize=${pageSize}`,
    );
    if (
      result.status === "7400" &&
      Array.isArray(result.response) &&
      result.response.every((item: any) => item && isCollectionId(item._id))
    )
      return { success: true, data: result.response };
    return {
      success: false,
      message:
        result.message || "Unable to load this collection. Please try again.",
    };
  } catch (error) {
    if (isRedirectError(error)) throw error;
    return {
      success: false,
      message: "Unable to load this collection. Please try again.",
    };
  }
}

// Compatibility for existing server-rendered callers. User identity comes from the session.
export async function getAllSavedFoldersAction({
  postId,
  returnAsCard,
}: {
  userId?: string;
  postId?: string | number;
  returnAsCard: boolean;
}): Promise<any> {
  const result = await getSavedFoldersAction(postId ?? 0);
  if (!result.success)
    return { status: 500, message: result.message, response: [] };
  return returnAsCard
    ? [...result.data]
        .reverse()
        .map((folder, index) => (
          <SavedFolderCard key={folder._id} folderCard={folder} index={index} />
        ))
    : { status: 200, response: result.data };
}
export async function getSavedItemsByFolderIdAction(
  folderId: string | undefined,
  _userId: string | undefined,
  pageNo: number,
  pageSize: number,
  returnAsCard: boolean,
): Promise<any> {
  const result = await getSavedItemsAction(folderId, pageNo, pageSize);
  if (!result.success) return { status: 500, message: result.message };
  return returnAsCard
    ? result.data.map((item, index) => (
        <SavedItemCard key={item._id} itemCard={item} index={index} />
      ))
    : result.data;
}
export async function createSaveCollectionFolderAction(
  _userId: string,
  name: string,
  path = "/saved-collection",
) {
  const trimmed = collectionName(name);
  if (!trimmed) return { status: 400, message: "Enter a collection name." };
  try {
    const viewerId = await resolveViewerIdAction();
    if (!viewerId) return { status: 401, message: "Please sign in again." };
    const result = await request("/collection", "POST", {
      userId: viewerId,
      collectionName: trimmed,
    });
    if (result.status === "7400") invalidate(undefined, path);
    return result;
  } catch (error) {
    if (isRedirectError(error)) throw error;
    return {
      status: 500,
      message: "Unable to create the collection. Please try again.",
    };
  }
}
export async function editSaveCollectionFolderAction(
  folderId: string,
  name: string,
  path = "/saved-collection",
) {
  const trimmed = collectionName(name);
  if (!isCollectionId(folderId) || !trimmed)
    return { status: 400, message: "Enter a valid collection name." };
  const result = await request(
    `/collection/${folderId}/${encodeURIComponent(trimmed)}`,
    "PUT",
    { name: trimmed },
  );
  if (result.status === "7400") invalidate(folderId, path);
  return result;
}
export async function deleteSaveCollectionFolderAction(
  folderId: string,
  path = "/saved-collection",
) {
  if (!isCollectionId(folderId))
    return { status: 400, message: "Invalid collection." };
  const result = await request(`/collection/${folderId}`, "DELETE");
  if (result.status === "7400") invalidate(folderId, path);
  return result;
}
export async function addPostToSaveCollectionAction(
  folderId: string,
  postId: string,
) {
  if (!isCollectionId(folderId) || !isCollectionId(postId))
    return { status: 400, message: "Invalid collection or post." };
  const result = await request(
    `/collection/post/${folderId}/${postId}`,
    "POST",
  );
  if (result.status === "7400") invalidate(folderId);
  return result;
}
export async function removeFromSaveCollectionAction(
  folderId: string,
  postId: string,
) {
  if (!isCollectionId(folderId) || !isCollectionId(postId))
    return { status: 400, message: "Invalid collection or post." };
  const result = await request(
    `/collection/post/${folderId}/${postId}`,
    "DELETE",
  );
  if (result.status === "7400") invalidate(folderId);
  return result;
}
