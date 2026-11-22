"use client";

import { createPushController, type PushSdk } from "./browser-push";

const appId = process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID?.trim() || "";
const siteOrigin = process.env.NEXT_PUBLIC_ONESIGNAL_SITE_ORIGIN?.trim() || "";
const configured =
  /^[a-f\d]{8}(-[a-f\d]{4}){3}-[a-f\d]{12}$/i.test(appId) && !!siteOrigin;
const marker = "te-browser-push-cleanup";
let sdkPromise: Promise<PushSdk> | undefined;

declare global {
  // ESLint does not count ambient interface merging as a use.
  // eslint-disable-next-line no-unused-vars
  interface Window {
    OneSignalDeferred?: { push: (callback: (sdk: PushSdk) => void) => unknown };
  }
}

function loadSdk() {
  if (sdkPromise) return sdkPromise;
  sdkPromise = new Promise<PushSdk>((resolve, reject) => {
    const timeout = window.setTimeout(
      () => reject(new Error("Push SDK timed out")),
      15000,
    );
    window.OneSignalDeferred =
      window.OneSignalDeferred || ([] as Array<(sdk: PushSdk) => void>);
    window.OneSignalDeferred.push(async (sdk) => {
      try {
        await sdk.init({
          appId,
          serviceWorkerPath: "OneSignalSDKWorker.js",
          serviceWorkerParam: { scope: "/" },
          allowLocalhostAsSecureOrigin:
            window.location.hostname === "localhost",
          autoResubscribe: false,
          notifyButton: { enable: false },
          welcomeNotification: { disable: true },
          promptOptions: {
            slidedown: { prompts: [{ type: "push", autoPrompt: false }] },
          },
        });
        resolve(sdk);
      } catch (error) {
        reject(error);
      } finally {
        window.clearTimeout(timeout);
      }
    });
    const script = document.createElement("script");
    script.src = "https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.page.js";
    script.defer = true;
    script.onerror = () => {
      window.clearTimeout(timeout);
      reject(new Error("Push SDK unavailable"));
    };
    document.head.appendChild(script);
  });
  return sdkPromise;
}

function storage() {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

export const browserPush = createPushController({
  configured,
  supported: () =>
    typeof window !== "undefined" &&
    window.location.origin === siteOrigin &&
    window.isSecureContext &&
    "Notification" in window &&
    "serviceWorker" in navigator &&
    "PushManager" in window,
  load: loadSdk,
  permission: () =>
    typeof Notification === "undefined" ? "default" : Notification.permission,
  remembered: () => storage()?.getItem(marker) === "1",
  remember: (active) => {
    try {
      if (active) storage()?.setItem(marker, "1");
      else storage()?.removeItem(marker);
    } catch {
      /* Storage may be disabled by the browser. */
    }
  },
});
