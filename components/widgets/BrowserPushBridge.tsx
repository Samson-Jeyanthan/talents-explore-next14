"use client";

import { useEffect } from "react";
import { useUserContext } from "@/context/AuthProvider";
import { getCurrentSessionUserAction } from "@/actions/session.action";
import { browserPush } from "@/lib/browser-push-client";

export default function BrowserPushBridge() {
  const { user } = useUserContext();
  useEffect(() => {
    const connect = () =>
      browserPush.connect(async () => {
        if (!user.currentUserId) return "";
        // Cached display data must never determine the push recipient.
        const result = await getCurrentSessionUserAction();
        if (!result) return "";
        if (result.status !== "7400")
          throw new Error("Session verification failed");
        return String(result.response?._id || "");
      });
    connect();
    window.addEventListener("focus", connect);
    return () => window.removeEventListener("focus", connect);
  }, [user.currentUserId]);
  return null;
}
