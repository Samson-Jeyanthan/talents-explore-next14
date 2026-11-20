"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { getCollaborationListAction } from "@/actions/collaboration.action";
import {
  CollaborationPages,
  type CollaborationTab,
  type CollaborationFilters,
  type CollaborationListResult,
} from "@/lib/utils/collaboration";

export function useCollaborationLists(initial: CollaborationListResult) {
  const controller = useRef(new CollaborationPages(initial)).current;
  const mounted = useRef(true);
  const [tabs, setTabs] = useState(() => controller.snapshot());
  const load = useCallback(
    async (tab: CollaborationTab) => {
      const pending = controller.load(tab, getCollaborationListAction);
      setTabs(controller.snapshot());
      await pending;
      if (mounted.current) setTabs(controller.snapshot());
    },
    [controller],
  );
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      controller.invalidate();
    };
  }, [controller]);
  useEffect(() => {
    controller.seed(initial);
    setTabs(controller.snapshot());
  }, [controller, initial]);
  function ensure(tab: CollaborationTab) {
    const state = controller.snapshot()[tab];
    if (!state.loaded && !state.loading && !state.error) return load(tab);
  }
  function apply(tab: CollaborationTab, filters: CollaborationFilters) {
    const state = controller.snapshot()[tab];
    if (
      state.loading &&
      JSON.stringify(state.filters) === JSON.stringify(filters)
    )
      return;
    controller.prepare(tab, filters);
    return load(tab);
  }
  function refresh(tab: CollaborationTab) {
    if (controller.snapshot()[tab].loading) return;
    controller.prepare(tab);
    return load(tab);
  }
  return { tabs, load, ensure, apply, refresh };
}
