"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import { useUserContext } from "@/context/AuthProvider";
import { getFollowerList, getFollowingList } from "@/actions/connection.action";
import { ConnectionPages } from "@/lib/utils/connections";
import ConnectionCard from "../cards/ConnectionCard";
import { Button } from "../ui/button";

export default function ConnectionList({
  kind,
}: {
  kind: "followers" | "following";
}) {
  const params = useParams();
  const profileId =
    typeof params.userId === "string" ? params.userId : undefined;
  const { user } = useUserContext();
  const viewerId = user?.currentUserId;
  const ownList = !!viewerId && viewerId === profileId;
  const controller = useRef(new ConnectionPages()).current;
  const mounted = useRef(true);
  const [state, setState] = useState(() => controller.snapshot());
  const loader = useCallback(
    (page: number) =>
      (kind === "followers" ? getFollowerList : getFollowingList)(
        profileId,
        undefined,
        page,
        10,
      ),
    [kind, profileId],
  );
  const load = useCallback(async () => {
    const pending = controller.load(loader);
    setState(controller.snapshot());
    await pending;
    if (mounted.current) setState(controller.snapshot());
  }, [controller, loader]);
  useEffect(() => {
    mounted.current = true;
    controller.reset();
    load();
    return () => {
      mounted.current = false;
      controller.invalidate();
    };
  }, [controller, load, viewerId]);
  function refresh() {
    controller.reset(true);
    return load();
  }
  function changed(id: string, following: boolean) {
    const remove = ownList && kind === "following" && !following;
    controller.update(id, following, remove);
    setState(controller.snapshot());
    if (remove) refresh();
  }
  return (
    <div
      className="flex w-full min-w-0 flex-col gap-3"
      aria-busy={state.loading}
    >
      <Button
        type="button"
        variant="ghost"
        disabled={state.loading}
        onClick={refresh}
        className="h-8 self-end px-2 text-xs text-light-600"
      >
        Refresh list
      </Button>
      {state.items.map((item, index) => (
        <ConnectionCard
          key={item._id}
          connectCard={item}
          index={index}
          connectionTab={kind === "following" ? 2 : 1}
          isOwnList={ownList}
          onChanged={(following) => changed(item._id, following)}
        />
      ))}
      {state.loading && (
        <p role="status" className="py-4 text-center text-sm text-light-500">
          Loading {kind}...
        </p>
      )}
      {state.error && (
        <div
          role={state.restricted ? "status" : "alert"}
          className="rounded-xl border border-dark-400 p-4 text-sm text-light-700"
        >
          <p>
            {state.restricted
              ? `This account's privacy settings do not allow you to view this ${kind} list.`
              : state.error}
          </p>
          {!state.restricted && (
            <Button
              type="button"
              disabled={state.loading}
              onClick={load}
              className="shad-button_secondary mt-3"
            >
              Try again
            </Button>
          )}
        </div>
      )}
      {!state.loading && !state.error && !state.items.length && (
        <p className="py-8 text-center text-sm text-light-500">
          {kind === "followers"
            ? "No followers yet."
            : "No accounts followed yet."}
        </p>
      )}
      {!state.error && state.hasMore && !state.loading && (
        <Button
          type="button"
          onClick={load}
          className="shad-button_secondary self-center"
        >
          Load more {kind}
        </Button>
      )}
    </div>
  );
}
