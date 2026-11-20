"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  getProfileOverallRating,
  getProfileRatingList,
} from "@/actions/connection.action";
import { FeedPagination } from "@/lib/utils/feedPagination";
import type { RatingUser, RatingSummary } from "@/lib/utils/ratings";

export function useProfileRatings(userId: string | undefined) {
  const controller = useRef(new FeedPagination<RatingUser>([], 10, 0)).current;
  const [page, setPage] = useState(() => controller.snapshot());
  const [summary, setSummary] = useState<RatingSummary | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(true);
  const [summaryError, setSummaryError] = useState("");
  const [restricted, setRestricted] = useState(false);
  const version = useRef(0);
  const summaryVersion = useRef(0);
  const load = useCallback(async () => {
    const current = version.current;
    const pending = controller.load(async (number) => {
      const result = await getProfileRatingList(userId, number, 10);
      if (current !== version.current) return { message: "Profile changed." };
      if ("response" in result) return result.response;
      if (result.restricted) setRestricted(true);
      return { message: result.message };
    });
    setPage(controller.snapshot());
    await pending;
    if (current === version.current) setPage(controller.snapshot());
  }, [controller, userId]);
  const loadSummary = useCallback(async () => {
    const current = version.current;
    const request = ++summaryVersion.current;
    setSummaryLoading(true);
    setSummaryError("");
    try {
      const result = await getProfileOverallRating(userId);
      if (current !== version.current || request !== summaryVersion.current)
        return;
      if ("response" in result) setSummary(result.response);
      else {
        setSummaryError(result.message);
        if (result.restricted) setRestricted(true);
      }
    } catch {
      if (current === version.current && request === summaryVersion.current)
        setSummaryError("Unable to load the rating summary. Please try again.");
    } finally {
      if (current === version.current && request === summaryVersion.current)
        setSummaryLoading(false);
    }
  }, [userId]);
  const refresh = useCallback(() => {
    version.current++;
    controller.reset([]);
    setSummary(null);
    setRestricted(false);
    return Promise.all([load(), loadSummary()]);
  }, [controller, load, loadSummary]);
  useEffect(() => {
    const generation = version;
    refresh();
    return () => {
      generation.current++;
      controller.invalidate();
    };
  }, [controller, refresh]);
  return {
    ...page,
    summary,
    summaryLoading,
    summaryError,
    restricted,
    load,
    loadSummary,
    refresh,
  };
}
