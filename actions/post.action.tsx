"use server";

import AllPostCard from "@/components/cards/AllPostCard";
import { IAllPostCardProp } from "@/types/post.types";
import { toast } from "sonner";

export async function getUserAllPosts(
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
    // return res;
    if (res.status === "7400") {
      const data = res.response;
      return data.map((item: IAllPostCardProp, index: number) => (
        <AllPostCard key={item._id} allPostCard={item} index={index} />
      ));
    } else {
      toast.error("Could not fetch post list", { duration: 4000 });
    }
  } catch {}
}
