"use client";
import { useEffect, useState } from "react";
import { getProfileSkillOptionsAction } from "@/actions/profile-skills.action";
import type { SkillOption } from "@/lib/utils/profile-skills";

export function useProfileSkillOptions(
  kind: "main" | "sub" | "skill",
  parentId: string,
  enabled: boolean,
) {
  const key = `${kind}:${parentId}:${enabled}`;
  const [attempt, setAttempt] = useState(0);
  const [result, setResult] = useState<{
    key: string;
    status: "loading" | "ready" | "error";
    options: SkillOption[];
    error?: string;
  }>({ key: "", status: "loading", options: [] });
  useEffect(() => {
    if (!enabled || (kind !== "main" && !parentId)) return;
    let active = true;
    setResult({ key, status: "loading", options: [] });
    getProfileSkillOptionsAction(kind, parentId)
      .then((response) => {
        if (!active) return;
        setResult(
          response.status === "7400"
            ? { key, status: "ready", options: response.response }
            : { key, status: "error", options: [], error: response.message },
        );
      })
      .catch(() => {
        if (active)
          setResult({
            key,
            status: "error",
            options: [],
            error: "Unable to load choices. Please try again.",
          });
      });
    return () => {
      active = false;
    };
  }, [key, kind, parentId, enabled, attempt]);
  return {
    ...(result.key === key
      ? result
      : { status: "loading" as const, options: [] }),
    retry: () => setAttempt((value) => value + 1),
  };
}
