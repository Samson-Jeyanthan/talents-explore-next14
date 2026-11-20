"use client";

import { useEffect, useRef, useState } from "react";
import {
  addPostRating,
  addProfileRatingAction,
} from "@/actions/connection.action";
import { displayRating, validRating } from "@/lib/utils/ratings";

export type RatingMode = "PROFILE" | "POST" | "SHARE" | "FILTER" | "UPLOAD";
export function useRating({
  initial,
  mode,
  authorId,
  postId,
  viewerId,
  path,
  onChange,
}: {
  initial: number;
  mode: RatingMode;
  authorId: string;
  postId?: string;
  viewerId?: string;
  path: string;
  onChange?: (value: number) => void;
}) {
  const local = mode === "FILTER" || mode === "UPLOAD";
  const [rating, setRating] = useState(() => displayRating(initial));
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const lock = useRef(false);
  const version = useRef(0);
  const confirmed = useRef(displayRating(initial));
  useEffect(() => {
    const generation = version;
    generation.current++;
    lock.current = false;
    setPending(false);
    setError("");
    setMessage("");
    return () => {
      generation.current++;
    };
  }, [mode, authorId, postId, viewerId]);
  useEffect(() => {
    if (!lock.current) {
      confirmed.current = displayRating(initial);
      setRating(confirmed.current);
      setMessage("");
    }
  }, [initial, mode, authorId, postId, viewerId]);
  async function submit(value: number) {
    if (lock.current || (!validRating(value) && !(local && value === 0)))
      return false;
    setMessage("");
    setError("");
    if (local) {
      confirmed.current = value;
      setRating(value);
      onChange?.(value);
      return true;
    }
    if (!viewerId) {
      setError("Please sign in to rate.");
      return false;
    }
    if (value === confirmed.current) {
      setMessage("You have already given this rating.");
      return false;
    }
    lock.current = true;
    setPending(true);
    const current = version.current;
    try {
      const result =
        mode === "PROFILE"
          ? await addProfileRatingAction(authorId, value, path)
          : await addPostRating(viewerId, postId, authorId, value, path);
      if (current !== version.current) return false;
      if (result?.status !== "7400") {
        setError(
          result?.message || "Unable to save your rating. Please try again.",
        );
        return false;
      }
      confirmed.current = value;
      setRating(value);
      setMessage("Rating saved.");
      onChange?.(value);
      return true;
    } catch {
      if (current === version.current)
        setError("Unable to save your rating. Please try again.");
      return false;
    } finally {
      if (current === version.current) {
        lock.current = false;
        setPending(false);
      }
    }
  }
  return { rating, pending, error, message, submit, local };
}
