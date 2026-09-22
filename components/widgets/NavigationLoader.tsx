"use client";

import { useEffect, useRef } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { useGlobalLoading } from "@/context/LoadingProvider";

const LOADER_DELAY_MS = 150;
const NAVIGATION_TIMEOUT_MS = 30_000;

export default function NavigationLoader() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const routeKey = `${pathname}?${searchParams.toString()}`;
  const { beginLoading } = useGlobalLoading();
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const timeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const finish = useRef<(() => void) | null>(null);

  const clearPendingNavigation = () => {
    if (timer.current) clearTimeout(timer.current);
    if (timeout.current) clearTimeout(timeout.current);
    timer.current = null;
    timeout.current = null;
    finish.current?.();
    finish.current = null;
  };

  useEffect(() => clearPendingNavigation, []);

  useEffect(() => {
    clearPendingNavigation();
  }, [routeKey]);

  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

      const anchor = (event.target as HTMLElement | null)?.closest<HTMLAnchorElement>("a[href]");
      if (!anchor || anchor.target || anchor.hasAttribute("download")) return;

      const destination = new URL(anchor.href, window.location.href);
      if (destination.origin !== window.location.origin) return;
      if (destination.pathname === window.location.pathname && destination.search === window.location.search) return;

      clearPendingNavigation();
      timer.current = setTimeout(() => {
        finish.current = beginLoading("Loading page...");
        timeout.current = setTimeout(clearPendingNavigation, NAVIGATION_TIMEOUT_MS);
      }, LOADER_DELAY_MS);
    };

    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, [beginLoading]);

  return null;
}
