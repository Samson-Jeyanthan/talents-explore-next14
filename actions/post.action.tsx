"use server";

import { revalidatePath } from "next/cache";
import { IPost } from "@/types/post.types";
import { getUserPersonalInfoAction } from "./auth.action";
import { getAuthHeaders, getSession } from "@/lib/session";
import { resolveViewerIdAction } from "./tokenAndHeaders.action";
import { isRedirectError } from "next/dist/client/components/redirect";
import { postUpdateValidation } from "@/lib/validations/postUpdate.validation";
import { getPostType } from "@/lib/utils/postEditing";

type TPostActionError = {
  status: number;
  message: string;
};

export async function updatePostAction(postId: string, payload: unknown) {
  if (!/^[a-f\d]{24}$/i.test(postId))
    return { status: "7404", message: "Invalid post." };
  const parsed = postUpdateValidation.safeParse(payload);
  if (!parsed.success)
    return { status: "7401", message: parsed.error.issues[0].message };
  try {
    const viewerId = await resolveViewerIdAction();
    const headers = await getAuthHeaders();
    const originalResponse = await fetch(
      `${process.env.NEXT_PUBLIC_BACKEND_URL}/feeds/${postId}/${viewerId}`,
      {
        headers,
        cache: "no-store",
        signal: AbortSignal.timeout(15000),
      },
    );
    if (!originalResponse.ok)
      return {
        status: "7404",
        message: "Unable to load this post. Please try again.",
      };
    const originalResult = await originalResponse.json();
    const original =
      originalResult?.status === "7400" ? originalResult.response : null;
    if (!original?._id)
      return {
        status: "7404",
        message: "Unable to load this post. Please try again.",
      };
    const authorId =
      typeof original.author === "string"
        ? original.author
        : original.author?._id;
    if (!viewerId || authorId !== viewerId)
      return { status: "7403", message: "You can only edit your own posts." };
    if (getPostType(original) !== parsed.data.type)
      return { status: "7401", message: "The content type cannot be changed." };
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_BACKEND_URL}/te-post/${postId}`,
      {
        method: "PUT",
        signal: AbortSignal.timeout(20000),
        headers,
        body: JSON.stringify({ ...parsed.data, userId: viewerId }),
      },
    );
    const result = await response.json();
    if (!response.ok || result?.status !== "7400") {
      return {
        status: "7401",
        message:
          typeof result?.message === "string"
            ? result.message
            : Array.isArray(result?.message)
              ? result.message.join(". ")
              : "Unable to save your changes. Please try again.",
      };
    }
    revalidatePath("/home");
    revalidatePath("/share-feed");
    revalidatePath(`/post/${postId}`);
    revalidatePath("/profile/[username]/[userId]", "layout");
    revalidatePath("/category/[id]", "page");
    revalidatePath("/explore", "layout");
    revalidatePath("/saved-collection", "layout");
    return { status: "7400", message: "Changes saved successfully." };
  } catch (error) {
    if (isRedirectError(error)) throw error;
    return {
      status: "7500",
      message:
        "Unable to save your changes. Your selected files have been kept for retry.",
    };
  }
}

/** Move a post/share to Recently Deleted. The backend authorizes ownership. */
export async function deletePostAction(postId: string) {
  if (typeof postId !== "string" || !/^[a-f\d]{24}$/i.test(postId)) {
    return { success: false, message: "Invalid post." };
  }
  try {
    const headers = await getAuthHeaders();
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_BACKEND_URL}/te-post/${postId}`,
      {
        method: "DELETE",
        headers,
        cache: "no-store",
      },
    );
    const result = await response.json();
    if (!response.ok || result?.status !== "7400") {
      return {
        success: false,
        message:
          typeof result?.message === "string"
            ? result.message
            : "Unable to delete this post. Please try again.",
      };
    }
    revalidatePath("/home");
    revalidatePath("/share-feed");
    revalidatePath("/settings/activity/deleted");
    revalidatePath("/post/[id]", "page");
    revalidatePath("/profile/[username]/[userId]", "layout");
    revalidatePath("/category/[id]", "page");
    revalidatePath("/explore", "layout");
    revalidatePath("/saved-collection", "layout");
    return { success: true, message: "Post moved to Recently Deleted." };
  } catch (error) {
    if (isRedirectError(error)) throw error;
    return {
      success: false,
      message: "Unable to delete this post. Please try again.",
    };
  }
}

async function resolveViewerId(accessToken: string | undefined) {
  if (!accessToken) {
    return "";
  }

  try {
    const userRes = await getUserPersonalInfoAction("");

    return userRes?.response?._id || "";
  } catch (error) {
    if (isRedirectError(error)) throw error;
    console.error("resolveViewerId failed:", error);
    return "";
  }
}

async function resolveRouteUserId(userOrToken: string | undefined) {
  const sessionToken = await getSession();

  if ((userOrToken === "userId" || userOrToken === "no_user") && sessionToken) {
    return (await resolveViewerId(sessionToken)) || "";
  }

  if (userOrToken && sessionToken && userOrToken === sessionToken) {
    return (await resolveViewerId(sessionToken)) || userOrToken;
  }

  return userOrToken || "";
}

export async function createPostShareAction(
  userId: string | undefined,
  formData: unknown,
  type: "POST" | "SHARELINK",
  revalidatePathURL: string,
) {
  try {
    const headers = await getAuthHeaders();
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_BACKEND_URL}/te-post`,
      {
        method: "POST",
        headers,
        body: JSON.stringify(formData),
      },
    );

    const res = await response.json();

    if (response.ok && res.status === "7400") {
      revalidatePath(revalidatePathURL);
      return res;
    } else {
      const data = {
        status: 400,
        message:
          typeof res?.message === "string"
            ? res.message
            : Array.isArray(res?.message)
              ? res.message
                  .filter((message: unknown) => typeof message === "string")
                  .join(". ")
              : "Could not upload post",
      };
      return data;
    }
  } catch (error) {
    console.error("createPostShareAction failed:", error);

    return {
      status: 500,
      message:
        error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}

export async function getWebCrawlerLinkAction(url: string) {
  try {
    const headers = await getAuthHeaders();
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_BACKEND_URL}/website-link-crawler/${url}`,
      {
        cache: "no-store",
        headers,
      },
    );
    console.log("website-link-crawler response", response);
    const res = await response.json();
    console.log("website-link-crawler res", res);
    return res;
  } catch (error) {
    console.error("getWebCrawlerLinkAction failed:", error);

    return {
      status: 500,
      message:
        error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}

export async function addPostToBestWorkAction(
  userId: string,
  postId: string,
  revalidatePathURL: string,
) {
  const formData = {
    userId,
    postId,
  };
  try {
    const headers = await getAuthHeaders();
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_BACKEND_URL}/te-post/addToBestWork`,
      {
        method: "POST",
        headers,
        body: JSON.stringify(formData),
      },
    );
    const res = await response.json();
    console.log(res);
    revalidatePath(revalidatePathURL);
    return res;
  } catch {}
}

export async function removeFromBestWorkAction(
  userId: string,
  postId: string,
  revalidatePathURL: string,
) {
  const formData = {
    userId,
    postId,
  };
  try {
    const headers = await getAuthHeaders();
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_BACKEND_URL}/te-post/removeFromBestWork`,
      {
        method: "POST",
        headers,
        body: JSON.stringify(formData),
      },
    );
    const res = await response.json();
    revalidatePath(revalidatePathURL);
    return res;
  } catch (error) {
    console.error(error);
    return error;
  }
}

export async function getPostByIdAction(
  postId: string | undefined,
  userId: string | undefined,
) {
  try {
    const resolvedUserId = (await resolveRouteUserId(userId)) || "no_user";
    const headers = await getAuthHeaders();
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_BACKEND_URL}/feeds/${postId}/${resolvedUserId}`,
      {
        cache: "no-store",
        headers,
      },
    );

    if (!response.ok) {
      return {
        status: response.status,
        message: "Could not find post data",
      };
    }

    const res = await response.json();
    if (res.status === "7400") {
      const data = res.response;
      return data;
    } else {
      const data = {
        status: 400,
        message: "Could not find post data",
      };
      return data;
    }
  } catch (error) {
    if (isRedirectError(error)) throw error;
    console.error("getPostByIdAction failed:", error);
    return {
      status: 500,
      message: "Could not find post data",
    };
  }
}

export async function getAllPostsAction(
  pageNo: number,
  pageSize: number,
): Promise<IPost[] | TPostActionError> {
  try {
    const viewerId = await resolveViewerIdAction();
    const accessToken = await getSession();

    if (!viewerId) {
      return {
        status: 401,
        message: "Could not identify the logged-in user for the home feed.",
      };
    }

    const response = await fetch(
      `${process.env.NEXT_PUBLIC_BACKEND_URL}/feeds/home?viewUserId=${viewerId}&userId=${viewerId}&pageNo=${pageNo}&pageSize=${pageSize}`,
      {
        cache: "no-store",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      },
    );

    if (!response.ok) {
      return {
        status: response.status,
        message: "Could not fetch home feed posts.",
      };
    }

    const res = await response.json();

    if (res.status === "7400") {
      return Array.isArray(res.response) ? res.response : [];
    }

    return {
      status: 400,
      message: res?.message || "Could not fetch all posts data",
    };
  } catch (error) {
    if (isRedirectError(error)) throw error;
    console.error("getAllPostsAction failed:", error);

    return {
      status: 500,
      message: "Something went wrong while loading the home feed.",
    };
  }
}

export async function getAllSharesAction(
  pageNo: number,
  pageSize: number,
): Promise<IPost[] | TPostActionError> {
  try {
    const viewerId = await resolveViewerIdAction();
    const accessToken = await getSession();

    if (!viewerId) {
      return {
        status: 401,
        message: "Could not identify the logged-in user for the home feed.",
      };
    }

    const response = await fetch(
      `${process.env.NEXT_PUBLIC_BACKEND_URL}/feeds/sharelinks?viewUserId=${viewerId}&userId=${viewerId}&pageNo=${pageNo}&pageSize=${pageSize}`,
      {
        cache: "no-store",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      },
    );

    if (!response.ok) {
      return {
        status: response.status,
        message: "Could not fetch home feed posts.",
      };
    }

    const res = await response.json();

    if (res.status === "7400") {
      return Array.isArray(res.response) ? res.response : [];
    }

    return {
      status: 400,
      message: res?.message || "Could not fetch all posts data",
    };
  } catch (error) {
    if (isRedirectError(error)) throw error;
    console.error("getAllPostsAction failed:", error);

    return {
      status: 500,
      message: "Something went wrong while loading the home feed.",
    };
  }
}
