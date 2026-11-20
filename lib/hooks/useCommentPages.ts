"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { CommentPages } from "@/lib/utils/commentPages";
import type { IComments } from "@/types/post.types";

export function useCommentPages(
  loader: (page: number) => Promise<{ items?: IComments[]; message?: string }>,
) {
  const controller = useRef(new CommentPages()).current;
  const mounted = useRef(true);
  const [state, setState] = useState(() => controller.snapshot());
  const load = useCallback(async () => {
    const pending = controller.load(loader);
    setState(controller.snapshot());
    await pending;
    if (mounted.current) setState(controller.snapshot());
  }, [controller, loader]);
  const prepend = useCallback(
    (item: IComments) => {
      controller.prepend(item);
      setState(controller.snapshot());
    },
    [controller],
  );
  const refresh = useCallback(() => {
    controller.reset();
    return load();
  }, [controller, load]);
  const update = useCallback(
    (id: string, change: (item: IComments) => IComments) => {
      controller.update(id, change);
      setState(controller.snapshot());
    },
    [controller],
  );
  useEffect(() => {
    mounted.current = true;
    controller.reset();
    load();
    return () => {
      mounted.current = false;
      controller.invalidate();
    };
  }, [controller, load]);
  return { ...state, load, prepend, refresh, update };
}
