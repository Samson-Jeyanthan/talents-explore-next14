"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  getLanguagesAction,
  getProfessionsAction,
} from "@/actions/utils.action";
import {
  parseProfileOptions,
  type ProfileOptionKind,
  type ProfileOptionsState,
} from "@/lib/utils/profile-options";

export function useProfileOptions(
  kind: ProfileOptionKind,
  initialResult: unknown,
) {
  const [result, setResult] = useState<ProfileOptionsState>(() =>
    initialResult === undefined
      ? { status: "loading", options: [] }
      : parseProfileOptions(initialResult, kind),
  );
  const request = useRef({ active: false, version: 0, busy: false });
  const retry = useCallback(async () => {
    const current = request.current;
    if (!current.active || current.busy) return;
    current.busy = true;
    const version = ++current.version;
    setResult((previous) => ({ ...previous, status: "loading" }));
    try {
      const response = await (kind === "language"
        ? getLanguagesAction()
        : getProfessionsAction());
      if (current.active && current.version === version)
        setResult(parseProfileOptions(response, kind));
    } catch {
      if (current.active && current.version === version)
        setResult((previous) => ({ ...previous, status: "error" }));
    } finally {
      if (current.version === version) current.busy = false;
    }
  }, [kind]);
  useEffect(() => {
    const current = request.current;
    current.active = true;
    current.version++;
    current.busy = false;
    if (initialResult === undefined) {
      setResult({ status: "loading", options: [] });
      retry();
    } else setResult(parseProfileOptions(initialResult, kind));
    return () => {
      current.active = false;
      current.version++;
      current.busy = false;
    };
  }, [initialResult, kind, retry]);
  return { ...result, retry };
}
