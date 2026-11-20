"use client";

import { useCallback } from "react";
import { getAllSharesAction } from "@/actions/post.action";
import PaginatedPostFeed from "@/components/widgets/feed/PaginatedPostFeed";
import { SHARE_PAGE_SIZE } from "@/lib/utils/categoryFeed";
import type { IPost } from "@/types/post.types";

export default function Feed({ initialPosts }: { initialPosts: IPost[] }) {
  const loadPage = useCallback(
    (page: number) => getAllSharesAction(page, SHARE_PAGE_SIZE),
    [],
  );
  return (
    <PaginatedPostFeed
      initialPosts={initialPosts}
      pageSize={SHARE_PAGE_SIZE}
      loadPage={loadPage}
      emptyMessage="No shared content found."
    />
  );
}
