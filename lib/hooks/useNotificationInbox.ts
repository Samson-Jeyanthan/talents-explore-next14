"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  getAllNotificationsAction,
  markNotificationAsReadAction,
  markAllNotificationsAsReadAction,
  deleteNotificationAction,
  deleteAllNotificationsAction,
} from "@/actions/notification.action";
import {
  isUnreadNotification,
  type NotificationItem,
  type NotificationPage,
} from "@/lib/utils/notifications";

const PAGE_SIZE = 20;
export function useNotificationInbox(initial: NotificationPage) {
  const [items, setItems] = useState<NotificationItem[]>(
    initial.success ? initial.data : [],
  );
  const [hasMore, setHasMore] = useState(
    initial.success && (initial.hasMore ?? initial.data.length >= PAGE_SIZE),
  );
  const [loading, setLoading] = useState(false);
  const [pending, setPending] = useState("");
  const [loadError, setLoadError] = useState(
    initial.success ? "" : initial.message,
  );
  const [writeError, setWriteError] = useState("");
  const page = useRef(1);
  const needsRefresh = useRef(!initial.success);
  const lock = useRef(false);
  const generation = useRef(0);
  const mounted = useRef(true);
  useEffect(() => {
    const alive = mounted;
    alive.current = true;
    return () => {
      alive.current = false;
    };
  }, []);
  useEffect(() => {
    if (lock.current) return;
    generation.current++;
    setItems(initial.success ? initial.data : []);
    setHasMore(
      initial.success && (initial.hasMore ?? initial.data.length >= PAGE_SIZE),
    );
    setLoadError(initial.success ? "" : initial.message);
    page.current = 1;
    needsRefresh.current = !initial.success;
  }, [initial]);

  const fetchPage = useCallback(async (first: boolean) => {
    const current = generation.current;
    const next = first ? 1 : page.current + 1;
    setLoading(true);
    setLoadError("");
    try {
      const result = await getAllNotificationsAction(
        undefined,
        next,
        PAGE_SIZE,
      );
      if (!mounted.current || current !== generation.current) return;
      if (!result.success) {
        setLoadError(result.message);
        return;
      }
      setItems((previous) => {
        if (first) return result.data;
        const seen = new Set(previous.map((item) => item._id));
        return [
          ...previous,
          ...result.data.filter((item) => !seen.has(item._id)),
        ];
      });
      page.current = next;
      needsRefresh.current = false;
      setHasMore(result.hasMore ?? result.data.length >= PAGE_SIZE);
    } catch {
      if (mounted.current && current === generation.current)
        setLoadError("Unable to load notifications. Please try again.");
    } finally {
      if (mounted.current && current === generation.current) setLoading(false);
    }
  }, []);

  const load = useCallback(
    async (refresh = false) => {
      if (lock.current || (!refresh && !needsRefresh.current && !hasMore))
        return;
      lock.current = true;
      if (refresh) needsRefresh.current = true;
      try {
        await fetchPage(refresh || needsRefresh.current);
      } finally {
        lock.current = false;
      }
    },
    [fetchPage, hasMore],
  );

  async function mutate(
    kind: "read" | "readAll" | "delete" | "deleteAll",
    id?: string,
  ) {
    if (lock.current) return false;
    lock.current = true;
    setPending(id || kind);
    setWriteError("");
    try {
      const result =
        kind === "read"
          ? await markNotificationAsReadAction(id!)
          : kind === "readAll"
            ? await markAllNotificationsAsReadAction()
            : kind === "delete"
              ? await deleteNotificationAction(id!)
              : await deleteAllNotificationsAction();
      if (!mounted.current) return false;
      if (result?.status !== "7400") {
        setWriteError(
          result?.message ||
            "Unable to update notifications. Please try again.",
        );
        return false;
      }
      if (kind === "read" || kind === "readAll") {
        setItems((previous) =>
          previous.map((item) =>
            (kind === "readAll" || item._id === id) &&
            isUnreadNotification(item)
              ? { ...item, status: "1" }
              : item,
          ),
        );
      } else if (kind === "deleteAll") {
        setItems([]);
        setHasMore(false);
        setLoadError("");
        page.current = 1;
        needsRefresh.current = false;
      } else {
        setItems((previous) => previous.filter((item) => item._id !== id));
        // Deletion changes server offsets. Restart at page one to avoid skipping a row.
        needsRefresh.current = true;
        await fetchPage(true);
      }
      return true;
    } catch {
      if (mounted.current)
        setWriteError("Unable to update notifications. Please try again.");
      return false;
    } finally {
      lock.current = false;
      if (mounted.current) setPending("");
    }
  }
  return {
    items,
    hasMore,
    loading,
    pending,
    loadError,
    writeError,
    load,
    mutate,
  };
}
