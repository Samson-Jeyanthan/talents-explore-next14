"use server";

import { revalidatePath } from "next/cache";
import AllPostCard from "@/components/cards/AllPostCard";
import { IPost } from "@/types/post.types";

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
