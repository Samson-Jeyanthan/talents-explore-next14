"use client";

import { useEffect, useRef, useState } from "react";
import {
  followUserAction,
  unFollowUserAction,
} from "@/actions/connection.action";
import { followFlag } from "@/lib/utils/connections";

export function useFollowConnection(
  userId: string,
  viewerId: string,
  initial: unknown,
  onChanged?: (following: boolean) => void,
) {
  const flag = followFlag(initial);
  const [following, setFollowing] = useState(flag);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const inFlight = useRef(false);
  const version = useRef(0);
  useEffect(() => {
    const generation = version;
    generation.current++;
    inFlight.current = false;
    setPending(false);
    setError("");
    return () => {
      generation.current++;
    };
  }, [userId, viewerId]);
  useEffect(() => {
    setFollowing(flag);
    setError("");
  }, [flag, userId, viewerId]);

  async function change(next: boolean) {
    if (inFlight.current || !viewerId || viewerId === userId) return false;
    inFlight.current = true;
    setPending(true);
    setError("");
    const current = version.current;
    try {
      const result = await (next
        ? followUserAction(userId)
        : unFollowUserAction(userId));
      if (current !== version.current) return false;
      if (result?.status !== "7400") {
        setError(
          result?.message ||
            "Unable to update this connection. Please try again.",
        );
        return false;
      }
      setFollowing(next);
      onChanged?.(next);
      return true;
    } catch {
      if (current === version.current)
        setError("Unable to update this connection. Please try again.");
      return false;
    } finally {
      if (current === version.current) {
        inFlight.current = false;
        setPending(false);
      }
    }
  }
  return { following, pending, error, change };
}
