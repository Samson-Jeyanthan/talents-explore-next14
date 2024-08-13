"use client";

import { useState, useEffect } from "react";

function useTimer() {
  // convert countdown from string to number
  const initialCountdown = (): number => {
    if (typeof window !== "undefined") {
      const savedCountdown = localStorage.getItem("countdown");
      return savedCountdown ? parseInt(savedCountdown, 10) : 1 * 40;
    }
    return 0;
  };

  // convert is otp open true to boolean
  const checkOTPOpen = (): boolean => {
    if (typeof window !== "undefined") {
      const savedOTPOpen = localStorage.getItem("isOTP") === "true";
      return savedOTPOpen;
    }
    return false;
  };

  // convert is otp timer true to boolean
  const checkOTPTimer = (): boolean => {
    if (typeof window !== "undefined") {
      const savedOTPTimer = localStorage.getItem("countdown") === "00:00";
      return savedOTPTimer;
    }
    return false;
  };

  const isOTPTimer = checkOTPTimer();
  const isOTPOpen = checkOTPOpen();
  const [isTimerRunning, setIsTimerRunning] = useState(true);
  const [countdown, setCountdown] = useState<any>(initialCountdown);

  // set interval for auto countdown
  useEffect(() => {
    setIsTimerRunning(true);
    if (isOTPOpen && !isOTPTimer && countdown > 0) {
      const intervalId = setInterval(() => {
        setCountdown((prevCountdown: any) => {
          const newCountdown = prevCountdown - 1;
          localStorage.setItem("countdown", newCountdown.toString());
          if (newCountdown === 0) {
            setIsTimerRunning(false);
            localStorage.setItem("countdown", "00:00");
          }
          return newCountdown;
        });
      }, 1000);
      return () => {
        clearInterval(intervalId);
        if (countdown === 0) {
          setIsTimerRunning(false);
          localStorage.setItem("countdown", "00:00");
        }
      };
    } else {
      setIsTimerRunning(false);
      localStorage.setItem("countdown", "00:00");
    }
  }, [countdown, isOTPOpen, isOTPTimer]);

  // function to display time countdown in the otp modal
  const formatTime = (time: any) => {
    const minutes = Math.floor(time / 60)
      .toString()
      .padStart(2, "0");
    const seconds = (time % 60).toString().padStart(2, "0");

    if (countdown === 0) {
      setIsTimerRunning(false);
      return "00:00";
    } else {
      return `${minutes}:${seconds}`;
    }
  };

  return {
    isTimerRunning,
    countdown,
    formatTime,
    setIsTimerRunning,
    setCountdown,
    checkOTPTimer,
  };
}

export default useTimer;
