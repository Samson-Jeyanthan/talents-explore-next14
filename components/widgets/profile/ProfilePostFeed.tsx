"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { getProfilePostPageAction } from "@/actions/profile-feed.action";
import { FeedPagination } from "@/lib/utils/feedPagination";
import {
  PROFILE_POST_PAGE_SIZE,
  type ProfileFeedKind,
  type ProfilePostPage,
} from "@/lib/utils/profile-feed";
import type { IPost } from "@/types/post.types";
import AllPostCard from "@/components/cards/AllPostCard";
import EmptyDetails from "@/components/others/EmptyDetails";
import CameraIcon from "@/public/assets/svgs/CameraIcon";
import CreditIcon from "@/public/assets/svgs/CreditIcon";
import { Button } from "@/components/ui/button";

export default function ProfilePostFeed({
  profileId,
  kind,
  initialResult,
}: {
  profileId: string;
  kind: ProfileFeedKind;
  initialResult: ProfilePostPage;
}) {
  const feed = useMemo(
    () => ({
      profileId,
      kind,
      paging: new FeedPagination<IPost>(
        initialResult.status === "7400" ? initialResult.response : [],
        PROFILE_POST_PAGE_SIZE,
        initialResult.status === "7400" ? 1 : 0,
      ),
    }),
    [profileId, kind, initialResult],
  );
  const paging = feed.paging;
  const current = useRef(paging);
  current.current = paging;
  const mounted = useRef(true);
  const [saved, setSaved] = useState(() => ({
    paging,
    value: paging.snapshot(),
  }));
  const [denied, setDenied] = useState({
    paging,
    message: initialResult.status === "private" ? initialResult.message : "",
  });
  const state = saved.paging === paging ? saved.value : paging.snapshot();
  const privacyMessage =
    denied.paging === paging
      ? denied.message
      : initialResult.status === "private"
        ? initialResult.message
        : "";
  const error =
    state.error ||
    (state.page === 0 && initialResult.status === "400"
      ? initialResult.message
      : "");
  const sentinel = useRef<HTMLDivElement>(null);
  useEffect(() => {
    mounted.current = true;
    setSaved({ paging, value: paging.snapshot() });
    return () => {
      mounted.current = false;
      paging.invalidate();
    };
  }, [paging]);
  const loadMore = useCallback(async () => {
    if (privacyMessage) return;
    const active = () => mounted.current && current.current === paging;
    const request = paging.load(async (page) => {
      const result = await getProfilePostPageAction(
        feed.profileId,
        feed.kind,
        page,
      );
      if (result.status === "private" && active()) {
        paging.reset([]);
        setDenied({ paging, message: result.message });
      }
      return result.status === "7400"
        ? result.response
        : { message: result.message };
    });
    setSaved({ paging, value: paging.snapshot() });
    await request;
    if (active()) setSaved({ paging, value: paging.snapshot() });
  }, [feed, paging, privacyMessage]);
  useEffect(() => {
    if (
      privacyMessage ||
      error ||
      !state.hasMore ||
      state.loading ||
      !sentinel.current ||
      typeof IntersectionObserver === "undefined"
    )
      return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) loadMore();
      },
      { rootMargin: "400px" },
    );
    observer.observe(sentinel.current);
    return () => observer.disconnect();
  }, [loadMore, state.hasMore, state.loading, error, privacyMessage]);
  if (privacyMessage) return <p className="text-light-900">{privacyMessage}</p>;
  return (
    <section
      className="my-8 flex min-h-80 w-full min-w-0 flex-col gap-4"
      aria-busy={state.loading}
    >
      {state.items.map((post, index) => (
        <AllPostCard key={post._id} allPostCard={post} index={index} />
      ))}
      {!state.items.length && !error && !state.loading && state.page > 0 ? (
        <div className="flex w-full justify-center pt-8">
          <EmptyDetails
            Icon={kind === "all" ? CameraIcon : CreditIcon}
            text="No Posts Available"
            size="56px"
          />
        </div>
      ) : null}
      <div
        ref={sentinel}
        className="flex min-h-16 flex-col items-center justify-center gap-3"
      >
        {state.loading ? (
          <p role="status" className="text-sm text-light-700">
            {state.items.length ? "Loading more posts..." : "Loading posts..."}
          </p>
        ) : null}
        {error && !state.loading ? (
          <p role="alert" className="text-sm text-red-700 dark:text-red-300">
            {error}
          </p>
        ) : null}
        {state.hasMore ? (
          <Button
            type="button"
            disabled={state.loading}
            onClick={loadMore}
            className="shad-button_secondary"
          >
            {error ? "Try again" : "Load more"}
          </Button>
        ) : null}
        {!state.hasMore && state.items.length > 0 ? (
          <p className="text-sm text-light-700">You&apos;ve reached the end.</p>
        ) : null}
      </div>
    </section>
  );
}
