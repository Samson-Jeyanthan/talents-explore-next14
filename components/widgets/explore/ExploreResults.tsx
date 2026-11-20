"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { searchAction } from "@/actions/search.action";
import { FeedPagination } from "@/lib/utils/feedPagination";
import {
  EXPLORE_PAGE_SIZE,
  type ExploreItem,
  type SearchQuery,
} from "@/lib/utils/explore";
import ExplorePostCard from "@/components/cards/ExplorePostCard";
import AllTalentsCard from "@/components/cards/AllTalentsCard";
import { Button } from "@/components/ui/button";

export default function ExploreResults({ query }: { query: SearchQuery }) {
  const controller = useRef(
    new FeedPagination<ExploreItem>([], EXPLORE_PAGE_SIZE, 0),
  ).current;
  const mounted = useRef(true);
  const [state, setState] = useState(() => controller.snapshot());
  const load = useCallback(async () => {
    const pending = controller.load(async (pageNo) => {
      const result = await searchAction({
        ...query,
        pageNo,
        pageSize: EXPLORE_PAGE_SIZE,
      });
      return result.status === "7400"
        ? result.response
        : { message: result.message };
    });
    setState(controller.snapshot());
    await pending;
    if (mounted.current) setState(controller.snapshot());
  }, [controller, query]);
  useEffect(() => {
    mounted.current = true;
    controller.reset([]);
    load();
    return () => {
      mounted.current = false;
      controller.invalidate();
    };
  }, [controller, load]);
  const label =
    query.searchType === "TALENT"
      ? "talents"
      : query.searchType === "SHARE"
        ? "shared content"
        : query.searchType === "FEED"
          ? "posts"
          : "posts and shared content";
  return (
    <section
      className="flex w-full min-w-0 flex-col gap-4"
      aria-label={`Explore ${label}`}
      aria-busy={state.loading}
    >
      <h2 className="break-words text-lg font-semibold text-light-900">
        {query.searchText
          ? `Results for “${query.searchText}”`
          : `Explore ${label}`}
      </h2>
      <div className="grid w-full min-w-0 grid-cols-1 gap-4 min-[380px]:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5">
        {state.items.map((item, index) =>
          query.searchType === "TALENT" ? (
            <AllTalentsCard
              key={item._id}
              allTalentsCard={item as any}
              index={index}
            />
          ) : (
            <ExplorePostCard key={item._id} postCard={item} index={index} />
          ),
        )}
      </div>
      {state.loading && (
        <p role="status" className="py-4 text-center text-sm text-light-500">
          Loading {label}...
        </p>
      )}
      {state.error && (
        <div
          role="alert"
          className="rounded-xl border border-dark-400 p-4 text-sm text-light-700"
        >
          <p>{state.error}</p>
          <Button
            type="button"
            disabled={state.loading}
            onClick={load}
            className="shad-button_secondary mt-3"
          >
            Try again
          </Button>
        </div>
      )}
      {!state.loading &&
        !state.error &&
        state.page > 0 &&
        !state.items.length && (
          <p className="py-8 text-center text-sm text-light-500">
            No {label} found. Try a different search or clear your filters.
          </p>
        )}
      {!state.loading && !state.error && state.hasMore && (
        <Button
          type="button"
          onClick={load}
          className="shad-button_secondary self-center"
        >
          Load more {label}
        </Button>
      )}
    </section>
  );
}
