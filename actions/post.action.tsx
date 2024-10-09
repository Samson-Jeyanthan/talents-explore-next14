"use server";

import { revalidatePath } from "next/cache";
import AllPostCard from "@/components/cards/AllPostCard";
import { IComments, IPost } from "@/types/post.types";
import { CommentCard, PostCard } from "@/components/cards";

export async function getUserAllPostsAction(
  userId: string | undefined,
  viewerId: string | undefined,
  pageNo: number,
  pageSize: number
) {
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_BACKEND_URL}/feeds/profile/all?userId=${userId}&viewUserId=${viewerId}&pageNo=${pageNo}&pageSize=${pageSize}`
    );
    const res = await response.json();
    if (res.status === "7400") {
      const data = res.response;
      return data.map((item: IPost, index: number) => (
        <AllPostCard key={item._id} allPostCard={item} index={index} />
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
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_BACKEND_URL}/te-post/addToBestWork`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
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
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_BACKEND_URL}/te-post/removeFromBestWork`,
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
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_BACKEND_URL}/feeds/profile/credit?userId=${userId}&viewUserId=${viewerId}&pageNo=${pageNo}&pageSize=${pageSize}`
    );
    const res = await response.json();
    if (res.status === "7400") {
      const data = res.response;
      return data.map((item: IPost, index: number) => (
        <AllPostCard key={item._id} allPostCard={item} index={index} />
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
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_BACKEND_URL}/feeds/${postId}/${userId}`
    );
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
  } catch {}
}

export async function getPostCommentsAction(
  postId: string | undefined,
  userId: string | undefined,
  pageNo: number
) {
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_BACKEND_URL}/comments?userId=${userId}&postId=${postId}&pageNo=${pageNo}&pageSize=${20}`
    );
    const res = await response.json();
    if (res.status === "7400") {
      const data = res.response;
      return data.map((item: IComments, index: number) => (
        <CommentCard key={item._id} commentCard={item} index={index} />
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
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_BACKEND_URL}/comments`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
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
  userId: string | undefined,
  pageNo: number,
  pageSize: number
) {
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_BACKEND_URL}/feeds/home?userId=${userId}&viewUserId=${userId}&pageNo=${pageNo}&pageSize=${pageSize}`
    );
    const res = await response.json();
    if (res.status === "7400") {
      const data = res.response;
      return data.map((item: IPost, index: number) => (
        <PostCard key={item._id} postFeedCard={item} index={index} />
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
