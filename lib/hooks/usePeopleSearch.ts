"use client";

import { useEffect, useRef, useState } from "react";
import { searchPeopleTag } from "@/actions/search.action";

export interface PeopleResult {
  _id: string;
  userName: string;
  firstName: string;
  lastName: string;
  profileImage: string | null;
}
export function usePeopleSearch(query: string, viewerId?: string) {
  const [items, setItems] = useState<PeopleResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [retry, setRetry] = useState(0);
  const version = useRef(0);
  const term = query.trim();
  useEffect(() => {
    const generation = version;
    const current = ++version.current;
    setItems([]);
    setError("");
    if (!term || !viewerId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    const timer = setTimeout(async () => {
      try {
        const result = await searchPeopleTag(viewerId, term, 1, 5);
        if (current !== version.current) return;
        if (result.status !== "7400") {
          setError(
            result.message || "Unable to search users. Please try again.",
          );
          return;
        }
        const text = (value: unknown) =>
          typeof value === "string" ? value : "";
        const seen = new Set<string>();
        setItems(
          result.response
            .filter((item: any) => {
              if (seen.has(item._id)) return false;
              seen.add(item._id);
              return true;
            })
            .map((item: any) => ({
              _id: item._id,
              userName:
                text(item.userName) ||
                text(item.personalInfo?.firstName) ||
                "user",
              firstName:
                text(item.personalInfo?.firstName) ||
                text(item.firstName) ||
                text(item.userName) ||
                "User",
              lastName:
                text(item.personalInfo?.lastName) || text(item.lastName),
              profileImage:
                text(item.personalInfo?.profileImage) ||
                text(item.profileImage) ||
                null,
            })),
        );
      } catch {
        if (current === version.current)
          setError("Unable to search users. Please try again.");
      } finally {
        if (current === version.current) setLoading(false);
      }
    }, 300);
    return () => {
      clearTimeout(timer);
      generation.current++;
    };
  }, [term, viewerId, retry]);
  return {
    items,
    loading,
    error,
    retry: () => setRetry((number) => number + 1),
  };
}
