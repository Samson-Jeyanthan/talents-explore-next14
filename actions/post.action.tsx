"use server";

import { revalidatePath } from "next/cache";
import AllPostCard from "@/components/cards/AllPostCard";
import { IComments, IPost } from "@/types/post.types";
import { CommentCard, PostCard } from "@/components/cards";
import { getUserPersonalInfoAction } from "./auth.action";
import { getAuthHeaders, getSession } from "@/lib/session";
import { resolveViewerIdAction } from "./tokenAndHeaders.action";

type TPostActionError = {
  status: number;
  message: string;
};

async function resolveViewerId(accessToken: string | undefined) {
  if (!accessToken) {
    return "";
  }

  try {
    const userRes = await getUserPersonalInfoAction("");

    return userRes?.response?._id || "";
  } catch (error) {
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

export async function getUserAllPostsAction(
  userId: string | undefined,
  viewerId: string | undefined,
  pageNo: number,
  pageSize: number
) {
  try {
    const resolvedViewerId = await resolveRouteUserId(viewerId);
    const headers = await getAuthHeaders();
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_BACKEND_URL}/feeds/profile/all?userId=${userId}&viewUserId=${resolvedViewerId}&pageNo=${pageNo}&pageSize=${pageSize}`,
      {
        cache: "no-store",
        headers,
      }
    );
    const res = await response.json();
    if (res.status === "7400") {
      const data = res.response;
      return data.map((item: IPost, index: number) => (
        <AllPostCard key={index} allPostCard={item} index={index} />
      ));
    } else {
      const data = {
        status: 400,
        message: "Could not fetch all posts data",
      };
      return data;
    }
  } catch {}
}

export async function addPostToBestWorkAction(
  userId: string,
  postId: string,
  revalidatePathURL: string
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
      }
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
  revalidatePathURL: string
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
      }
    );
    const res = await response.json();
    revalidatePath(revalidatePathURL);
    return res;
  } catch (error) {
    console.error(error);
    return error;
  }
}

export async function getUserCreditPostsAction(
  userId: string | undefined,
  viewerId: string | undefined,
  pageNo: number,
  pageSize: number
) {
  try {
    const resolvedViewerId = await resolveRouteUserId(viewerId);
    const headers = await getAuthHeaders();
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_BACKEND_URL}/feeds/profile/credit?userId=${userId}&viewUserId=${resolvedViewerId}&pageNo=${pageNo}&pageSize=${pageSize}`,
      {
        cache: "no-store",
        headers,
      }
    );
    const res = await response.json();
    if (res.status === "7400") {
      const data = res.response;
      return data.map((item: IPost, index: number) => (
        <AllPostCard key={index} allPostCard={item} index={index} />
      ));
    } else {
      const data = {
        status: 400,
        message: "Could not fetch credit data",
      };
      return data;
    }
  } catch {}
}

export async function getPostByIdAction(
  postId: string | undefined,
  userId: string | undefined
) {
  try {
    const resolvedUserId = (await resolveRouteUserId(userId)) || "no_user";
    const headers = await getAuthHeaders();
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_BACKEND_URL}/feeds/${postId}/${resolvedUserId}`,
      {
        cache: "no-store",
        headers,
      }
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
    console.error("getPostByIdAction failed:", error);
    return {
      status: 500,
      message: "Could not find post data",
    };
  }
}

export async function getPostCommentsAction(
  postId: string | undefined,
  _userId: string | undefined,
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
      return data.map((item: IComments, index: number) => (
        <CommentCard key={index} commentCard={item} index={index} />
      ));
    } else {
      const data = {
        status: 400,
        message: "Could not find post data",
      };
      return data;
    }
  } catch {}
}

export async function addPostCommentAction(
  userId: string,
  postId: string,
  comment: string,
  revalidatePathURL: string
) {
  const formData = {
    userId,
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
      revalidatePath(revalidatePathURL);
    }
    return res;
  } catch {}
}

export async function getAllPostsAction(
  pageNo: number,
  pageSize: number
  // eslint-disable-next-line no-undef
): Promise<JSX.Element[] | TPostActionError> {
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
      `${process.env.NEXT_PUBLIC_BACKEND_URL}/feeds/home?&viewUserId=${viewerId}&userId=${viewerId}&pageNo=${pageNo}&pageSize=${pageSize}`,
      {
        cache: "no-store",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    if (!response.ok) {
      return {
        status: response.status,
        message: "Could not fetch home feed posts.",
      };
    }

    const res = await response.json();

    if (res.status === "7400") {
      const data = Array.isArray(res.response) ? res.response : [];
      console.log("// [getAllPostsAction] res: //", data[0]);
      return data.map((item: IPost, index: number) => (
        <PostCard key={index} postFeedCard={item} index={index} />
      ));
    } else {
      return {
        status: 400,
        message: res?.message || "Could not fetch all posts data",
      };
    }
  } catch (error) {
    console.error("getAllPostsAction failed:", error);
    return {
      status: 500,
      message: "Something went wrong while loading the home feed.",
    };
  }
}
