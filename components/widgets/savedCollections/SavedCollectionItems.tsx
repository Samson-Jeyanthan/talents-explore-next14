"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { getSavedItemsAction } from "@/actions/save.action";
import { FeedPagination } from "@/lib/utils/feedPagination";
import SavedItemCard from "@/components/cards/SavedItemCard";
import { Button } from "@/components/ui/button";
import type { ISavedItem } from "@/types/post.types";

export default function SavedCollectionItems({
  folderId,
  initialItems,
}: {
  folderId: string;
  initialItems: ISavedItem[];
}) {
  const controller = useRef(new FeedPagination(initialItems, 20)).current;
  const [state, setState] = useState(() => controller.snapshot());
  const mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    controller.reset(initialItems);
    setState(controller.snapshot());
    return () => {
      mounted.current = false;
      controller.invalidate();
    };
  }, [folderId, initialItems, controller]);
  const load = useCallback(async () => {
    const pending = controller.load(async (page) => {
      const result = await getSavedItemsAction(folderId, page, 20);
      return result.success ? result.data : { message: result.message };
    });
    setState(controller.snapshot());
    await pending;
    if (mounted.current) setState(controller.snapshot());
  }, [controller, folderId]);
  return (
    <div className="flex w-full flex-col gap-4">
      {!state.items.length && (
        <p className="py-6 text-sm text-light-500">
          No saved posts in this collection yet.
        </p>
      )}
      <div className="w-full columns-1 gap-x-4 sm:columns-2 md:columns-3 lg:columns-4 xl:columns-5">
        {state.items.map((item, index) => (
          <SavedItemCard key={item._id} itemCard={item} index={index} />
        ))}
      </div>
      {state.loading && (
        <p role="status" className="text-sm text-light-500">
          Loading saved posts...
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
          onClick={load}
          className="shad-button_secondary w-fit"
        >
          {state.error ? "Try again" : "Load more saved posts"}
        </Button>
      )}
    </div>
  );
}
