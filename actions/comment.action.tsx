"use server";

import { getAuthHeaders } from "@/lib/session";
import { revalidatePath } from "next/cache";

export async function getCommentsAction(
  postId: string | undefined,
  pageNo: number
) {
  try {
    const headers = await getAuthHeaders();
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_BACKEND_URL}/comments?postId=${postId}&pageNo=${pageNo}&pageSize=${20}`,
      {
        cache: "no-store",
        headers,
      }
    );
    const res = await response.json();
    if (res.status === "7400") {
      const data = res.response;

      const result = {
        status: 200,
        response: data,
      };
      return result;
    } else {
      const data = {
        status: 400,
        message: "Could not find comments",
        response: [],
      };
      return data;
    }
  } catch {}
}

export async function addCommentAction(
  postId: string,
  comment: string,
  revalidatePathURL?: string
) {
  const formData = {
    postId,
    comment,
  };
  try {
    const headers = await getAuthHeaders();
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_BACKEND_URL}/comments`,
      {
        method: "POST",
        headers,
        body: JSON.stringify(formData),
      }
    );
    const res = await response.json();
    if (res.status === "7400") {
      if (revalidatePathURL) revalidatePath(revalidatePathURL);
      return res;
    } else {
      const data = {
        status: 400,
        message: "Could not add comment",
      };
      return data;
    }
  } catch (error) {
    console.error("getRepliesOfCommentAction error:", error);
    throw error;
  }
}

export async function getRepliesOfCommentAction(
  parentCommentId: string,
  pageNo: number,
  pageSize: number,
  revalidatePathURL: string
) {
  try {
    const headers = await getAuthHeaders();
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_BACKEND_URL}/comments/replies?parentCommentId=${parentCommentId}&pageNo=${pageNo}&pageSize=${pageSize}`,
      {
        method: "GET",
        headers,
      }
    );
    const res = await response.json();
    console.log("getRepliesOfCommentAction-res", res);
    if (res.status === "7400") {
      return res;
    } else {
      const data = {
        status: 400,
        message: "Could not fetch replies",
      };
      return data;
    }
  } catch (error) {
    console.error("getRepliesOfCommentAction error:", error);
    throw error;
  }
}

export async function addReplyAction(
  postId: string,
  parentCommentId: string | null | undefined,
  comment: string,
  revalidatePathURL?: string
) {
  const formData = {
    postId,
    parentCommentId,
    comment,
  };
  try {
    const headers = await getAuthHeaders();
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_BACKEND_URL}/comments/reply`,
      {
        method: "POST",
        headers,
        body: JSON.stringify(formData),
      }
    );
    const res = await response.json();
    if (res.status === "7400") {
      if (revalidatePathURL) revalidatePath(revalidatePathURL);
      return res;
    } else {
      const data = {
        status: 400,
        message: "Could not add reply",
      };
      return data;
    }
  } catch (error) {
    console.error("addReplyAction error:", error);
    throw error;
  }
}

export async function commentLikeAction(commentId: string) {
  try {
    const headers = await getAuthHeaders();
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_BACKEND_URL}/comments/like`,
      {
        method: "POST",
        headers,
        body: JSON.stringify({
          commentId,
        }),
      }
    );
    const res = await response.json();
    if (res.status === "7400") {
      return res;
    } else {
      const data = {
        status: 400,
        message: "Could not like comment",
      };
      return data;
    }
  } catch (error) {
    console.error("commentLikeAction error:", error);
    throw error;
  }
}
