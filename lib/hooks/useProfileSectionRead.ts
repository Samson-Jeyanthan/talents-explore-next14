"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  profileSectionResult,
  type ProfileSectionResult,
} from "@/lib/utils/profile-sections";

export function useProfileSectionRead<T>(
  profileId: string,
  initialResult: ProfileSectionResult<T>,
  load: (id: string) => Promise<ProfileSectionResult<T>>,
  fallback: string,
) {
  const resource = useMemo(
    () => ({
      profileId,
      initialResult: profileSectionResult<T>(initialResult, fallback),
      load,
      busy: false,
      version: 0,
    }),
    [profileId, initialResult, load, fallback],
  );
  const current = useRef(resource);
  current.current = resource;
  const [saved, setSaved] = useState(() => ({
    resource,
    result: resource.initialResult,
    pending: false,
  }));
  useEffect(
    () => () => {
      resource.version++;
    },
    [resource],
  );
  const state =
    saved.resource === resource
      ? saved
      : { resource, result: resource.initialResult, pending: false };
  const retry = async () => {
    if (resource.busy) return;
    resource.busy = true;
    const version = resource.version;
    const active = () =>
      current.current === resource && version === resource.version;
    setSaved({ resource, result: state.result, pending: true });
    try {
      const result = await resource.load(resource.profileId);
      if (active())
        setSaved({
          resource,
          result: profileSectionResult<T>(result, fallback),
          pending: false,
        });
    } catch {
      if (active())
        setSaved({
          resource,
          result: { status: "400", response: [], message: fallback },
          pending: false,
        });
    } finally {
      if (active()) resource.busy = false;
    }
  };
  return { result: state.result, pending: state.pending, retry };
}
