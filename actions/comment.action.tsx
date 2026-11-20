"use server";

import { getAuthHeaders } from "@/lib/session";
import { revalidatePath } from "next/cache";
import { isRedirectError } from "next/dist/client/components/redirect";

const validId = (value: unknown) =>
  typeof value === "string" && /^[a-f\d]{24}$/i.test(value);
const validPage = (page: number) => Number.isInteger(page) && page > 0;

async function request(
  path: string,
  fallback: string,
  body?: object,
  method?: "DELETE",
) {
  try {
    const headers = await getAuthHeaders();
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_BACKEND_URL}${path}`,
      {
        method: method || (body ? "POST" : "GET"),
        cache: "no-store",
        headers,
        ...(body ? { body: JSON.stringify(body) } : {}),
      },
    );
    const result = await response.json();
    if (response.ok && result?.status === "7400") return result;
    return {
      status: response.ok ? 400 : response.status,
      message: typeof result?.message === "string" ? result.message : fallback,
    };
  } catch (error) {
    if (isRedirectError(error)) throw error;
    return { status: 500, message: fallback };
  }
}

export async function getCommentsAction(
  postId: string | undefined,
  pageNo: number,
) {
  if (!validId(postId) || !validPage(pageNo))
    return { status: 400, message: "Invalid comment request." };
  const result = await request(
    `/comments?postId=${postId}&pageNo=${pageNo}&pageSize=20`,
    "Unable to load comments. Please try again.",
  );
  if (result.status === "7400") {
    if (!Array.isArray(result.response))
      return {
        status: 500,
        message: "Unable to load comments. Please try again.",
      };
    return { ...result, status: 200 };
  }
  return result;
}

export async function getRepliesOfCommentAction(
  parentCommentId: string,
  pageNo: number,
  pageSize = 20,
  _revalidatePathURL?: string,
) {
  if (
    !validId(parentCommentId) ||
    !validPage(pageNo) ||
    !Number.isInteger(pageSize) ||
    pageSize < 1 ||
    pageSize > 100
  )
    return { status: 400, message: "Invalid reply request." };
  const result = await request(
    `/comments/replies?parentCommentId=${parentCommentId}&pageNo=${pageNo}&pageSize=${pageSize}`,
    "Unable to load replies. Please try again.",
  );
  if (result.status === "7400" && !Array.isArray(result.response))
    return {
      status: 500,
      message: "Unable to load replies. Please try again.",
    };
  return result;
}

async function submit(
  postId: string,
  comment: string,
  parentCommentId?: string | null,
  revalidatePathURL?: string,
) {
  if (
    !validId(postId) ||
    typeof comment !== "string" ||
    !comment.trim() ||
    (parentCommentId !== undefined && !validId(parentCommentId))
  )
    return { status: 400, message: "Please enter a valid comment or reply." };
  const result = await request(
    parentCommentId ? "/comments/reply" : "/comments",
    "Unable to send. Your text has been kept; please try again.",
    {
      postId,
      comment: comment.trim(),
      ...(parentCommentId ? { parentCommentId } : {}),
    },
  );
  if (result.status === "7400") {
    revalidatePath(`/post/${postId}`);
    if (revalidatePathURL) revalidatePath(revalidatePathURL);
  }
  return result;
}

export async function addCommentAction(
  postId: string,
  comment: string,
  revalidatePathURL?: string,
) {
  return submit(postId, comment, undefined, revalidatePathURL);
}

export async function addReplyAction(
  postId: string,
  parentCommentId: string | null | undefined,
  comment: string,
  revalidatePathURL?: string,
  rootCommentId?: string,
) {
  if (!validId(parentCommentId))
    return { status: 400, message: "Please select a comment to reply to." };
  const result = await submit(
    postId,
    comment,
    parentCommentId,
    revalidatePathURL,
  );
  if (
    [400, 404].includes(result.status) &&
    validId(rootCommentId) &&
    rootCommentId !== parentCommentId &&
    /parent|not found/i.test(result.message || "")
  )
    return submit(postId, comment, rootCommentId, revalidatePathURL);
  return result;
}

export async function commentLikeAction(commentId: string) {
  if (!validId(commentId)) return { status: 400, message: "Invalid comment." };
  return request(
    "/comments/like",
    "Unable to update this like. Please try again.",
    { commentId },
  );
}

export async function deleteCommentAction(
  commentId: string,
  postId: string,
  revalidatePathURL?: string,
) {
  if (!validId(commentId) || !validId(postId))
    return { status: 400, message: "Invalid comment." };
  // The backend verifies comment-author/post-owner permissions for this ID.
  const result = await request(
    `/comments/${commentId}`,
    "Unable to delete. Please try again.",
    undefined,
    "DELETE",
  );
  if (result.status === "7400") {
    revalidatePath(`/post/${postId}`);
    if (revalidatePathURL) revalidatePath(revalidatePathURL);
  }
  return result;
}
