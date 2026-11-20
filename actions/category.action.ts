"use server";

import { searchAction } from "./search.action";
import { resolveViewerIdAction } from "./tokenAndHeaders.action";
import {
  CATEGORY_PAGE_SIZE,
  categoryFeedQueryValidation,
  CategoryFeedQuery,
} from "@/lib/utils/categoryFeed";
import { isRedirectError } from "next/dist/client/components/redirect";
import type { IPost } from "@/types/post.types";

export async function getCategoryPostsAction(
  query: CategoryFeedQuery,
  pageNo = 1,
): Promise<IPost[] | { status: number; message: string }> {
  const parsed = categoryFeedQueryValidation.safeParse(query);
  if (!parsed.success || !Number.isInteger(pageNo) || pageNo < 1)
    return { status: 400, message: "Invalid category filters." };
  try {
    const viewerId = await resolveViewerIdAction();
    const result = await searchAction({
      ...parsed.data,
      searchType: "ALL",
      viewUserId: viewerId,
      pageNo,
      pageSize: CATEGORY_PAGE_SIZE,
    });
    if (result?.status === "7400" && Array.isArray(result.response))
      return result.response as IPost[];
    return {
      status: 500,
      message: "Unable to load category content. Please try again.",
    };
  } catch (error) {
    if (isRedirectError(error)) throw error;
    return {
      status: 500,
      message: "Unable to load category content. Please try again.",
    };
  }
}
