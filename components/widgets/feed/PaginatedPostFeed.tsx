"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import PostCard from "@/components/cards/PostCard";
import { Button } from "@/components/ui/button";
import { FeedPagination, FeedPageResult } from "@/lib/utils/feedPagination";
import type { IPost } from "@/types/post.types";

type Props = {
  initialPosts: IPost[];
  pageSize: number;
  loadPage: (page: number) => Promise<FeedPageResult<IPost>>;
  emptyMessage: string;
};

export default function PaginatedPostFeed({
  initialPosts,
  pageSize,
  loadPage,
  emptyMessage,
}: Props) {
  const controller = useRef<FeedPagination<IPost>>();
  if (!controller.current)
    controller.current = new FeedPagination(initialPosts, pageSize);
  const paging = controller.current;
  const [state, setState] = useState(() => paging.snapshot());
  const loaderRef = useRef<HTMLDivElement>(null);
  const mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    paging.reset(initialPosts);
    setState(paging.snapshot());
    return () => {
      mounted.current = false;
      paging.invalidate();
    };
  }, [initialPosts, paging]);
  const loadMore = useCallback(async () => {
    const request = paging.load(loadPage);
    setState(paging.snapshot());
    await request;
    if (mounted.current) setState(paging.snapshot());
  }, [paging, loadPage]);
  useEffect(() => {
    if (!state.hasMore || state.loading || state.error || !loaderRef.current)
      return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) loadMore();
      },
      { rootMargin: "500px" },
    );
    observer.observe(loaderRef.current);
    return () => observer.disconnect();
  }, [state.hasMore, state.loading, state.error, loadMore]);
  return (
    <div className="flex w-full max-w-xl flex-col gap-4 pb-8">
      {state.items.map((post, index) => (
        <PostCard key={post._id} postFeedCard={post} index={index} />
      ))}
      {!state.items.length && (
        <p className="py-6 text-sm text-light-500">{emptyMessage}</p>
      )}
      <div
        ref={loaderRef}
        className="flex min-h-16 flex-col items-center justify-center gap-3"
      >
        {state.loading && (
          <p role="status" className="text-sm text-light-700">
            Loading more content...
          </p>
        )}
        {state.error && (
          <p role="alert" className="text-sm text-red-500">
            {state.error}
          </p>
        )}
        {state.hasMore && (
          <Button
            type="button"
            disabled={state.loading}
            className="shad-button_secondary"
            onClick={loadMore}
          >
            {state.error ? "Try again" : "Load more"}
          </Button>
        )}
        {!state.hasMore && state.items.length > 0 && (
          <p className="text-sm text-light-700">You&apos;ve reached the end.</p>
        )}
      </div>
    </div>
  );
}
