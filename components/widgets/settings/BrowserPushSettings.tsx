"use client";

import { useSyncExternalStore } from "react";
import { Button } from "@/components/ui/button";
import { browserPush } from "@/lib/browser-push-client";

const serverSnapshot = browserPush.getSnapshot();

export default function BrowserPushSettings({
  accountEnabled,
}: {
  accountEnabled: boolean;
}) {
  const state = useSyncExternalStore(
    browserPush.subscribe,
    browserPush.getSnapshot,
    () => serverSnapshot,
  );
  const unavailable = state.status === "unconfigured";
  const supported = state.status !== "unsupported";
  const ready = state.status === "ready";
  const description = unavailable
    ? "Browser notifications are not available yet. You can still read notifications in the app."
    : !supported
      ? "Push notifications are unavailable in this browser or on this site. On iPhone and iPad, try the app from your Home Screen."
      : state.blocked
        ? "Notifications are blocked. Allow notifications in your browser’s site settings, then reload this page."
        : state.enabled
          ? "Notifications are enabled on this browser."
          : "Receive notifications on this device when you are away from the app.";
  return (
    <div className="grid gap-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-light-900">This browser</p>
          <p className="mt-1 text-sm text-light-500" role="status">
            {description}
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          disabled={
            !ready ||
            state.pending ||
            (!state.enabled && (state.blocked || !accountEnabled))
          }
          onClick={() => browserPush.setEnabled(!state.enabled)}
        >
          {state.pending
            ? "Updating…"
            : state.status === "loading"
              ? "Connecting…"
              : state.enabled
                ? "Disable on this browser"
                : "Enable on this browser"}
        </Button>
      </div>
      {!accountEnabled && ready && (
        <p className="text-sm text-light-500">
          Turn on push notifications above to receive notifications on this
          browser.
        </p>
      )}
      {state.error && (
        <p className="text-sm text-red-500" role="alert">
          {state.error}
        </p>
      )}
      {state.status === "error" && (
        <Button
          type="button"
          variant="outline"
          onClick={() => window.location.reload()}
        >
          Reload page
        </Button>
      )}
    </div>
  );
}
