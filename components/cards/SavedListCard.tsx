"use client";

import { Check, Loader2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import {
  addPostToSaveCollectionAction,
  removeFromSaveCollectionAction,
} from "@/actions/save.action";

export default function SavedListCard({
  collectionId,
  collectionName,
  postId,
  postStatus,
  onChanged,
}: {
  collectionId: string;
  collectionName: string;
  postId: string;
  postStatus: boolean;
  index?: number;
  onChanged?: (saved: boolean) => void;
}) {
  const [saved, setSaved] = useState(postStatus);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const inFlight = useRef(false);
  const version = useRef(0);
  useEffect(() => {
    const requestVersion = version;
    version.current++;
    inFlight.current = false;
    setBusy(false);
    setError("");
    return () => {
      requestVersion.current++;
    };
  }, [collectionId, postId]);
  useEffect(() => {
    setSaved(postStatus);
  }, [postStatus, postId, collectionId]);
  async function toggle() {
    if (inFlight.current) return;
    inFlight.current = true;
    setBusy(true);
    setError("");
    const generation = version.current;
    const next = !saved;
    try {
      const result = await (next
        ? addPostToSaveCollectionAction(collectionId, postId)
        : removeFromSaveCollectionAction(collectionId, postId));
      if (generation !== version.current) return;
      if (result?.status !== "7400") {
        setError(result?.message || "Unable to update. Try again.");
        return;
      }
      setSaved(next);
      onChanged?.(next);
    } catch {
      if (generation === version.current)
        setError("Unable to update. Try again.");
    } finally {
      if (generation === version.current) {
        inFlight.current = false;
        setBusy(false);
      }
    }
  }
  return (
    <div className="rounded-xl border border-dark-400/50">
      <button
        type="button"
        aria-pressed={saved}
        aria-busy={busy}
        disabled={busy}
        onClick={toggle}
        className="flex w-full items-center justify-between gap-3 rounded-xl p-4 text-left text-sm text-light-900 hover:bg-dark-300"
      >
        <span className="min-w-0 break-words">{collectionName}</span>
        <span className="flex shrink-0 items-center gap-2 text-xs text-light-500">
          {busy ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              Saving...
            </>
          ) : saved ? (
            <>
              Saved
              <Check className="size-4 text-primary-500" />
            </>
          ) : (
            "Not saved"
          )}
        </span>
      </button>
      {error && (
        <div
          role="alert"
          className="flex items-center justify-between gap-3 px-4 pb-3 text-xs text-red-500"
        >
          <span>{error}</span>
          <button
            type="button"
            disabled={busy}
            onClick={toggle}
            className="shrink-0 underline"
          >
            Try again
          </button>
        </div>
      )}
    </div>
  );
}
