export type PushSdk = {
  init: (options: Record<string, unknown>) => Promise<void>;
  login: (id: string) => Promise<void>;
  logout: () => Promise<void>;
  User: {
    externalId?: string;
    PushSubscription: {
      optedIn?: boolean;
      optIn: () => Promise<void>;
      optOut: () => Promise<void>;
      addEventListener: (event: string, callback: () => void) => void;
    };
  };
  Notifications: {
    isPushSupported: () => boolean;
    addEventListener: (event: string, callback: () => void) => void;
  };
};

export type PushState = {
  status:
    | "unconfigured"
    | "unsupported"
    | "idle"
    | "loading"
    | "ready"
    | "error";
  enabled: boolean;
  blocked: boolean;
  pending: boolean;
  error: string;
};

// Serialized identity changes prevent a late login from undoing sign-out.
export function createPushController(options: {
  configured: boolean;
  supported: () => boolean;
  load: () => Promise<PushSdk>;
  permission: () => string;
  remembered: () => boolean;
  remember: (active: boolean) => void;
}) {
  let state: PushState = {
    status: options.configured ? "idle" : "unconfigured",
    enabled: false,
    blocked: false,
    pending: false,
    error: "",
  };
  let sdk: PushSdk | undefined;
  let identity = "";
  let generation = 0;
  let queue = Promise.resolve();
  const listeners = new Set<() => void>();
  function update(patch: Partial<PushState>) {
    state = { ...state, ...patch };
    listeners.forEach((listener) => listener());
  }
  function refresh() {
    update({
      enabled:
        !!identity &&
        !!sdk?.User.PushSubscription.optedIn &&
        options.permission() === "granted",
      blocked: options.permission() === "denied",
    });
  }
  function enqueue(work: () => Promise<void>) {
    queue = queue.then(work, work);
    return queue;
  }
  async function detach() {
    identity = "";
    if (!sdk) return;
    // Always attempt logout, even when opting out fails.
    try {
      await sdk.User.PushSubscription.optOut();
    } finally {
      await sdk.logout();
    }
    options.remember(false);
  }
  return {
    getSnapshot: () => state,
    subscribe(listener: () => void) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    connect(resolveIdentity: () => Promise<string>) {
      const version = ++generation;
      if (!options.configured) return Promise.resolve();
      if (!options.supported()) {
        update({ status: "unsupported" });
        return Promise.resolve();
      }
      update({ status: "loading", enabled: false, error: "" });
      // Resolve outside the queue so sign-out never waits for session verification.
      return resolveIdentity()
        .then((id) =>
          enqueue(async () => {
            if (version !== generation) return;
            if (!id && !sdk && !options.remembered()) {
              update({ status: "idle" });
              return;
            }
            if (!sdk) {
              sdk = await options.load();
              sdk.User.PushSubscription.addEventListener("change", refresh);
              sdk.Notifications.addEventListener("permissionChange", refresh);
            }
            if (version !== generation) return;
            if (!sdk.Notifications.isPushSupported()) {
              update({ status: "unsupported" });
              return;
            }
            if (!id) {
              await detach();
              update({ status: "idle", enabled: false });
              return;
            }
            if (
              (identity && identity !== id) ||
              (sdk.User.externalId && sdk.User.externalId !== id)
            )
              await detach();
            // Persist only a cleanup marker, never a user ID or credential.
            options.remember(true);
            await sdk.login(id);
            if (version !== generation) return;
            identity = id;
            update({ status: "ready" });
            refresh();
          }),
        )
        .catch(() =>
          enqueue(async () => {
            if (version !== generation) return;
            // If session verification fails, stop any previously linked subscription.
            identity = "";
            try {
              if (!sdk && options.remembered()) sdk = await options.load();
              await detach();
            } catch {
              /* Retain the marker so cleanup can be retried after reload. */
            }
            if (version === generation)
              update({
                status: "error",
                enabled: false,
                error:
                  "Browser notifications could not connect. Reload the page to try again.",
              });
          }),
        );
    },
    disconnect() {
      ++generation;
      identity = "";
      update({
        status: options.configured ? "idle" : "unconfigured",
        enabled: false,
      });
      return enqueue(async () => {
        try {
          await detach();
        } catch {
          // Keep the marker so a later page load retries cleanup.
          update({
            error:
              "Browser notification sign-out could not finish. Reconnect and reload this page.",
          });
        } finally {
          refresh();
        }
      });
    },
    setEnabled(enabled: boolean) {
      if (state.status !== "ready" || state.pending || !identity || !sdk)
        return Promise.resolve();
      const version = generation;
      update({ pending: true, error: "" });
      return enqueue(async () => {
        try {
          if (version !== generation || !sdk) return;
          if (enabled) await sdk.User.PushSubscription.optIn();
          else await sdk.User.PushSubscription.optOut();
        } catch {
          if (version === generation)
            update({
              error:
                "Could not update browser notifications. Please try again.",
            });
        } finally {
          update({ pending: false });
          refresh();
        }
      });
    },
  };
}
