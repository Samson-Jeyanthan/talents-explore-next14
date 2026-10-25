"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { getAllPostsAction } from "@/actions/post.action";
import { IPost } from "@/types/post.types";
import { PostCard } from "@/components/cards";

interface FeedProps {
  initialPosts: IPost[];
}

const PAGE_SIZE = 10;

export default function Feed({ initialPosts }: FeedProps) {
  const [posts, setPosts] = useState<IPost[]>(initialPosts);
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [hasMore, setHasMore] = useState(initialPosts.length === PAGE_SIZE);

  const loaderRef = useRef<HTMLDivElement | null>(null);

  const loadMorePosts = useCallback(async () => {
    if (isLoading || !hasMore) return;

    setIsLoading(true);

    const nextPage = page + 1;

    try {
      const data = await getAllPostsAction(nextPage, PAGE_SIZE);

      if (!Array.isArray(data)) {
        console.error("Failed to load more posts:", data.message);
        return;
      }

      if (data.length === 0) {
        setHasMore(false);
        return;
      }

      setPosts((prevPosts) => [...prevPosts, ...data]);

      setPage(nextPage);

      // If backend returns fewer than PAGE_SIZE,
      // assume there are no more posts.
      if (data.length < PAGE_SIZE) {
        setHasMore(false);
      }
    } catch (error) {
      console.error("Load more posts failed:", error);
    } finally {
      setIsLoading(false);
    }
  }, [page, isLoading, hasMore]);

  useEffect(() => {
    const loader = loaderRef.current;

    if (!loader) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];

        if (entry.isIntersecting) {
          loadMorePosts();
        }
      },
      {
        root: null,
        rootMargin: "500px",
        threshold: 0,
      }
    );

    observer.observe(loader);

    return () => {
      observer.disconnect();
    };
  }, [loadMorePosts]);

  return (
    <div className="flex w-full max-w-xl flex-col gap-4 pb-8">
      {posts.length > 0 &&
        posts.map((post, index) => (
          <PostCard key={post._id ?? index} postFeedCard={post} index={index} />
        ))}

      {/* Infinite scroll trigger */}
      <div
        ref={loaderRef}
        className="flex min-h-16 items-center justify-center"
      >
        {isLoading && (
          <p className="text-sm text-light-700">Loading more posts...</p>
        )}

        {!hasMore && posts.length > 0 && (
          <p className="text-sm text-light-700">You&apos;ve reached the end.</p>
        )}
      </div>
    </div>
  );
}
