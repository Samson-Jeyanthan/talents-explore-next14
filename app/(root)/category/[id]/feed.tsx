"use client";

import { useCallback } from "react";
import { getCategoryPostsAction } from "@/actions/category.action";
import PaginatedPostFeed from "@/components/widgets/feed/PaginatedPostFeed";
import {
  CATEGORY_PAGE_SIZE,
  CategoryFeedQuery,
} from "@/lib/utils/categoryFeed";
import type { IPost } from "@/types/post.types";

export default function Feed({
  initialPosts,
  query,
}: {
  initialPosts: IPost[];
  query: CategoryFeedQuery;
}) {
  const loadPage = useCallback(
    (page: number) => getCategoryPostsAction(query, page),
    [query],
  );
  return (
    <PaginatedPostFeed
      key={JSON.stringify(query)}
      initialPosts={initialPosts}
      pageSize={CATEGORY_PAGE_SIZE}
      loadPage={loadPage}
      emptyMessage="No content matches this category and its filters."
    />
  );
}
