"use client";
import { useCallback, useEffect, useRef, useState } from "react";

/** One write at a time, including the time React has not rendered pending yet. */
export function useCollaborationWrite(identity: string) {
  const lock = useRef(false);
  const generation = useRef({ version: 0 });
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => {
    const epoch = generation.current;
    epoch.version++;
    lock.current = false;
    setPending(false);
    setError("");
    return () => {
      epoch.version++;
    };
  }, [identity]);
  const run = async (
    request: () => Promise<any>,
    saved: (result: any) => void | Promise<void>,
  ) => {
    if (lock.current) return;
    lock.current = true;
    const version = generation.current.version;
    setPending(true);
    setError("");
    let acknowledged = false;
    try {
      const result = await request();
      if (version !== generation.current.version) return;
      if (result?.status !== "7400") {
        setError(result?.message || "Unable to save. Please try again.");
        return;
      }
      acknowledged = true;
      await saved(result);
    } catch {
      if (version === generation.current.version)
        setError(
          acknowledged
            ? "Your changes were saved, but the screen could not refresh. Reload to see the latest status."
            : "Unable to save. Your information is still here; please try again.",
        );
    } finally {
      if (version === generation.current.version) {
        lock.current = false;
        setPending(false);
      }
    }
  };
  return { pending, error, run, setError };
}

/** Keep accepted data on failures and reject responses for old filters or pages. */
export function useWorkflowPages(
  identity: string,
  initial: any[],
  request: (query: any) => Promise<any>,
  key: (item: any) => string,
  initialError = "",
) {
  const [items, setItems] = useState<any[]>(initial);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(initialError);
  const [hasMore, setHasMore] = useState(initial.length >= 20);
  const cursor = useRef({
    query: {} as any,
    page: 1,
    generation: 0,
    busy: false,
    failedPage: 1,
  });
  const requestRef = useRef(request);
  requestRef.current = request;
  const keyRef = useRef(key);
  keyRef.current = key;
  useEffect(
    () => () => {
      cursor.current.generation++;
    },
    [identity],
  );
  const load = useCallback(async (query: any, page = 1, replace = false) => {
    const current = cursor.current;
    if (!replace && current.busy) return;
    if (replace) current.generation++;
    const version = current.generation;
    current.busy = true;
    current.query = query;
    current.failedPage = page;
    setLoading(true);
    setError("");
    if (replace) {
      setItems([]);
      setHasMore(false);
      current.page = 0;
    }
    try {
      const result = await requestRef.current({
        ...query,
        pageNo: page,
        pageSize: 20,
      });
      if (version !== current.generation) return;
      if (result?.status !== "7400" || !Array.isArray(result.response))
        throw new Error(
          result?.message || "Unable to load results. Please try again.",
        );
      const rows = result.response;
      setItems((previous) => {
        const merged = new Map<string, any>();
        for (const row of page > 1 ? previous : [])
          merged.set(keyRef.current(row), row);
        for (const row of rows) merged.set(keyRef.current(row), row);
        return Array.from(merged.values());
      });
      current.page = page;
      setHasMore(rows.length >= 20);
    } catch (e) {
      if (version === current.generation)
        setError(
          e instanceof Error
            ? e.message
            : "Unable to load results. Please try again.",
        );
    } finally {
      if (version === current.generation) {
        current.busy = false;
        setLoading(false);
      }
    }
  }, []);
  const apply = (query: any) => load(query, 1, true);
  const more = () => load(cursor.current.query, cursor.current.page + 1);
  const retry = () => load(cursor.current.query, cursor.current.failedPage);
  const refresh = () => load(cursor.current.query, 1);
  return {
    items,
    setItems,
    loading,
    error,
    hasMore,
    apply,
    more,
    retry,
    refresh,
  };
}
