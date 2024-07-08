"use client";

import React, { FormEvent, useState } from "react";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { DialogContent, DialogOverlay } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { Button } from "../ui/button";
import useTimer from "@/lib/hooks/useTimer";
import { useRouter } from "next/navigation";
import { TOTPProps } from "@/types/auth.types";
import {
  handleResendFPOtp,
  handleResendOtp,
  handleVerifyEmailOtp,
  handleVerifyForgotPasswordOtp,
} from "@/lib/functions/auth.functions";

const OTP = ({
  isSignup,
  setIsOpen,
  verifiedEmail,
  setVerifiedUserId,
}: TOTPProps) => {
  const router = useRouter();
  const [value, setValue] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const {
    isTimerRunning,
    countdown,
    formatTime,
    setIsTimerRunning,
    setCountdown,
  } = useTimer();

  const countdownValue = localStorage.getItem("countdown") ?? "0";
  const isTimer = parseInt(countdownValue) > 0;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    console.log(value);

    if (value.length === 0) {
      setError("OTP Verification Code is Required");
    } else if (value.length !== 6) {
      setError("OTP Verification Code must be 6 digits");
    } else {
      setError(null);
      // forgot password otp
      if (!isSignup) {
        const verifyOtpEmailData = {
          email: verifiedEmail && verifiedEmail,
          otp: parseInt(value),
        };
        const response = await handleVerifyForgotPasswordOtp(
          verifyOtpEmailData,
          { setIsOpen }
        );
        // parse the verified id to reset password modal
        if (setVerifiedUserId) {
          setVerifiedUserId(response);
        }
      } else {
        // sign-up email otp
        const formData = {
          userId: "651a4167806d38119491d9ee",
          emailVerificationCode: parseInt(value),
          deviceId: "string",
          appVersion: "string",
        };
        await handleVerifyEmailOtp(formData);
      }
    }
  };

  const handleResend = async () => {
    localStorage.setItem("countdown", "");
    setIsTimerRunning(true);
    setCountdown(10 * 60); // 10 min
    setError(null);
    if (!isSignup) {
      const email = verifiedEmail && verifiedEmail;
      await handleResendFPOtp(email);
    } else {
      const userId = "651a4167806d38119491d9ee";
      await handleResendOtp(userId);
    }
  };

  const handleCancel = () => {
    localStorage.removeItem("countdown");
    localStorage.removeItem("isOTP");
    router.push("/sign-in");
  };

  return (
    <>
      <DialogOverlay className={cn("bg-black/10 backdrop-blur-sm")} />
      <DialogContent className="flex max-w-96 flex-col items-center gap-3 border-none bg-dark-250 p-5">
        <h1 className="h1-bold text-light-900">Verify Your Account</h1>
        <p className="text-justify text-[12px] text-light-900">
          Check your inbox we have send an OTP verification code to your email.
          Please Enter the code to
          {isSignup ? " continue..." : " reset password"}
        </p>
        <form
          onSubmit={handleSubmit}
          className="flex w-full flex-col items-center gap-2"
        >
          <InputOTP
            maxLength={6}
            value={value}
            onChange={(value: any) => setValue(value)}
          >
            <InputOTPGroup className="gap-[11px] text-light-900">
              <InputOTPSlot index={0} className="shad-input_otp" />
              <InputOTPSlot index={1} className="shad-input_otp" />
              <InputOTPSlot index={2} className="shad-input_otp" />
              <InputOTPSlot index={3} className="shad-input_otp" />
              <InputOTPSlot index={4} className="shad-input_otp" />
              <InputOTPSlot index={5} className="shad-input_otp" />
            </InputOTPGroup>
          </InputOTP>

          {error && (
            <p className="font-regular my-2 text-custom-100">{error}</p>
          )}

          {isTimerRunning || isTimer ? (
            <h4 className="flex-center my-2 w-full gap-2 text-[13px] text-light-700">
              Verification code expires in
              <span className="text-primary-500">{formatTime(countdown)}</span>
            </h4>
          ) : (
            <>
              {!error && (
                <p className="font-regular my-2 text-custom-100">
                  Your OTP has expired. Try again!
                </p>
              )}
            </>
          )}

          <Button type="submit" className="shad-button_primary w-full">
            Submit
          </Button>

          <div className="flex-center mt-2 w-full gap-2 text-[13px] text-light-700">
            <h4>Didn&rsquo;t receive the code?</h4>
            <p
              onClick={handleResend}
              className="cursor-pointer text-primary-500"
            >
              Resend
            </p>
          </div>

          {!isSignup && (
            <p
              className="font-regular my-4 mb-1 cursor-pointer text-light-700 hover:text-light-900"
              onClick={handleCancel}
            >
              Cancel
            </p>
          )}
        </form>
      </DialogContent>
    </>
  );
};

export default OTP;
