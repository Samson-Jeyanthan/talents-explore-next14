"use client";

import React, { type FormEvent, useEffect, useRef, useState } from "react";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import {
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "../ui/button";
import useTimer from "@/lib/hooks/useTimer";
import type { TOTPProps } from "@/types/auth.types";
import {
  handleResendForgotpasswordOtp,
  handleResendOtp,
  handleVerifyEmailOtp,
  handleVerifyForgotPasswordOtp,
} from "@/lib/functions/auth.functions";
import {
  clearOtpSession,
  readOtpSession,
  startOtpSession,
  validOtpIdentifier,
} from "@/lib/utils/otp-session";
import { clearCachedAuthUser } from "@/lib/utils/auth-user-cache";
import { toast } from "sonner";

export default function OTP({
  userId,
  email,
  isSignup,
  setIsOpen,
  setVerifiedUserId,
  setVerifiedOtp,
}: TOTPProps) {
  const kind = isSignup ? "signup" : "password";
  const [session, setSession] = useState(() => {
    const restored = readOtpSession(kind);
    if (restored) return restored;
    const identifier = isSignup ? userId : email;
    return validOtpIdentifier(kind, identifier)
      ? startOtpSession(kind, identifier)
      : null;
  });
  const [value, setValue] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState<"verify" | "resend" | null>(null);
  const operation = useRef(false);
  const lifecycle = useRef({ active: true, version: 0 });
  useEffect(() => {
    const current = lifecycle.current;
    current.active = true;
    current.version++;
    return () => {
      current.active = false;
      current.version++;
    };
  }, []);
  const { countdown, resendCountdown, formatTime } = useTimer(session);
  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (operation.current) return;
    if (!/^\d{6}$/.test(value)) {
      setError("Enter the 6-digit verification code.");
      return;
    }
    if (!session) {
      setError("Please request a new verification code.");
      return;
    }
    operation.current = true;
    setPending("verify");
    setError("");
    const version = lifecycle.current.version;
    let completed = false;
    try {
      const result = isSignup
        ? await handleVerifyEmailOtp({
            userId: session.identifier,
            emailVerificationCode: Number(value),
            deviceId: "web",
            appVersion: "web",
          })
        : await handleVerifyForgotPasswordOtp({
            email: session.identifier,
            otp: value,
          });
      if (!lifecycle.current.active || version !== lifecycle.current.version)
        return;
      if (!result) {
        setError("Unable to verify this code. Check it or request a new one.");
        return;
      }
      clearOtpSession(kind);
      if (isSignup) {
        clearCachedAuthUser();
        // Reload after cookie creation so auth context is restored from the
        // verified server session, including after a registration-page refresh.
        window.location.assign("/complete-profile");
      } else {
        setVerifiedUserId?.(result);
        setVerifiedOtp?.(value);
        setIsOpen?.({ isFP: false, isOTP: false, isReset: true });
      }
      completed = true;
    } catch {
      if (lifecycle.current.active && version === lifecycle.current.version)
        setError("Unable to verify the code right now. Please try again.");
    } finally {
      if (
        lifecycle.current.active &&
        version === lifecycle.current.version &&
        !completed
      ) {
        operation.current = false;
        setPending(null);
      }
    }
  };
  const resend = async () => {
    if (operation.current || resendCountdown > 0) return;
    if (!session) {
      setError("Please request a new verification code.");
      return;
    }
    operation.current = true;
    setPending("resend");
    setError("");
    const version = lifecycle.current.version;
    try {
      const result = isSignup
        ? await handleResendOtp(session.identifier)
        : await handleResendForgotpasswordOtp(session.identifier);
      if (!lifecycle.current.active || version !== lifecycle.current.version)
        return;
      if (result) {
        setSession(startOtpSession(kind, session.identifier));
        setValue("");
        toast.success("A new verification code has been sent.");
      } else setError("Unable to resend the code. Please try again.");
    } catch {
      if (lifecycle.current.active && version === lifecycle.current.version)
        setError("Unable to resend the code. Please try again.");
    } finally {
      if (lifecycle.current.active && version === lifecycle.current.version) {
        operation.current = false;
        setPending(null);
      }
    }
  };
  const cancel = () => {
    if (operation.current) return;
    clearOtpSession(kind);
    window.location.assign("/sign-in");
  };
  return (
    <DialogContent
      className="flex max-w-96 flex-col items-center gap-3 rounded-xl border-none bg-dark-250 p-5 [&>button]:hidden"
      onEscapeKeyDown={(event) => {
        event.preventDefault();
        cancel();
      }}
      onInteractOutside={(event) => event.preventDefault()}
    >
      <DialogTitle className="h1-bold text-light-900">
        Verify Your Account
      </DialogTitle>
      <DialogDescription className="text-justify text-[12px] text-light-900">
        Check your inbox for the verification code. Enter it to{" "}
        {isSignup ? "continue registration." : "reset your password."}
      </DialogDescription>
      <form
        onSubmit={handleSubmit}
        className="flex w-full flex-col items-center gap-2"
        aria-busy={!!pending}
      >
        <InputOTP
          maxLength={6}
          value={value}
          onChange={setValue}
          disabled={!!pending}
        >
          <InputOTPGroup className="gap-[11px] text-light-900">
            {[0, 1, 2, 3, 4, 5].map((index) => (
              <InputOTPSlot
                key={index}
                index={index}
                className="shad-input_otp"
              />
            ))}
          </InputOTPGroup>
        </InputOTP>
        {error && (
          <p role="alert" className="my-2 text-sm text-custom-100">
            {error}
          </p>
        )}
        <p className="my-2 text-[13px] text-light-700">
          {countdown > 0 ? (
            <>
              Verification code expires in{" "}
              <span className="text-primary-500">{formatTime(countdown)}</span>
            </>
          ) : (
            "If your code has expired, request a new one."
          )}
        </p>
        <Button
          type="submit"
          className="shad-button_primary w-full"
          disabled={!!pending || !session}
        >
          {pending === "verify" ? "Verifying..." : "Submit"}
        </Button>
        <div className="flex-center mt-2 w-full flex-wrap gap-2 text-[13px] text-light-700">
          <span>Didn&rsquo;t receive the code?</span>
          <button
            type="button"
            onClick={resend}
            disabled={!!pending || !session || resendCountdown > 0}
            className="text-primary-500 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {pending === "resend"
              ? "Sending..."
              : resendCountdown > 0
                ? `Resend in ${resendCountdown}s`
                : "Resend"}
          </button>
        </div>
        <button
          type="button"
          onClick={cancel}
          disabled={!!pending}
          className="my-4 mb-1 text-light-700 hover:text-light-900 disabled:opacity-50"
        >
          Cancel
        </button>
      </form>
    </DialogContent>
  );
}
