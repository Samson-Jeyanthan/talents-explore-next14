"use client";
import { useEffect, useRef, useState } from "react";

export function useProfileAwardWrite(identity: string) {
  const state = useRef({ busy: false, version: 0 });
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => {
    const current = state.current;
    current.version++;
    current.busy = false;
    setPending(false);
    setError("");
    return () => {
      current.version++;
    };
  }, [identity]);
  const run = async (
    request: (active: () => boolean) => Promise<any>,
    saved: () => void,
  ) => {
    const current = state.current;
    if (current.busy) return;
    current.busy = true;
    const version = current.version;
    setPending(true);
    setError("");
    const active = () => version === current.version;
    try {
      const result = await request(active);
      if (!active()) return;
      if (result?.status !== "7400") {
        setError(result?.message || "Unable to save. Please try again.");
        return;
      }
      saved();
    } catch {
      if (active())
        setError(
          "Unable to save. Your information is still here; please try again.",
        );
    } finally {
      if (active()) {
        current.busy = false;
        setPending(false);
      }
    }
  };
  return { pending, error, setError, run };
}
