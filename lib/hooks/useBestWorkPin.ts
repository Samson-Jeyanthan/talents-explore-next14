"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  addPostToBestWorkAction,
  removeFromBestWorkAction,
} from "@/actions/post.action";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export function useBestWorkPin(
  postId: string,
  userId: string,
  initialPinned: boolean,
  canPin: boolean,
) {
  const router = useRouter();
  const resource = useMemo(
    () => ({ postId, userId, initialPinned, canPin, busy: false, version: 0 }),
    [postId, userId, initialPinned, canPin],
  );
  const current = useRef<typeof resource | null>(resource);
  current.current = resource;
  const [state, setState] = useState({
    resource,
    pinned: initialPinned,
    pending: false,
  });
  const visible =
    state.resource === resource
      ? state
      : { pinned: initialPinned, pending: false };

  useEffect(() => {
    current.current = resource;
    return () => {
      resource.version++;
      resource.busy = false;
      if (current.current === resource) current.current = null;
    };
  }, [resource]);

  const togglePin = async () => {
    if (!canPin || !userId || resource.busy || current.current !== resource)
      return;
    resource.busy = true;
    const version = ++resource.version;
    const pinned = visible.pinned;
    const isCurrent = () =>
      current.current === resource && resource.version === version;
    setState({ resource, pinned, pending: true });
    try {
      const result = await (
        pinned ? removeFromBestWorkAction : addPostToBestWorkAction
      )(userId, postId);
      if (!isCurrent()) return;
      if (result?.status !== "7400") {
        toast.error(
          result?.message || "Unable to update Best Work. Please try again.",
        );
        return;
      }
      setState({ resource, pinned: !pinned, pending: false });
      toast.success(result.message);
      router.refresh();
    } catch {
      if (isCurrent())
        toast.error("Unable to update Best Work. Please try again.");
    } finally {
      if (isCurrent()) {
        resource.busy = false;
        setState((previous) =>
          previous.resource === resource
            ? { ...previous, pending: false }
            : previous,
        );
      }
    }
  };

  return { isPinned: visible.pinned, pinning: visible.pending, togglePin };
}
