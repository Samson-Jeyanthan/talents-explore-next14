"use client";

import { useEffect, useState } from "react";
import type { OtpSession } from "@/lib/utils/otp-session";

export default function useTimer(session: OtpSession | null) {
  const [now, setNow] = useState(Date.now);
  useEffect(() => {
    if (!session) return;
    const tick = () => setNow(Date.now());
    tick();
    const interval = window.setInterval(tick, 1000);
    window.addEventListener("focus", tick);
    document.addEventListener("visibilitychange", tick);
    return () => {
      window.clearInterval(interval);
      window.removeEventListener("focus", tick);
      document.removeEventListener("visibilitychange", tick);
    };
  }, [session]);
  const remaining = (deadline: number | undefined) =>
    deadline === undefined
      ? 0
      : Math.max(0, Math.ceil((deadline - now) / 1000));
  return {
    countdown: remaining(session?.expiresAt),
    resendCountdown: remaining(session?.resendAt),
    formatTime: (seconds: number) =>
      `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`,
  };
}
