"use client";

import React, { FormEvent, useState } from "react";
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
import { useRouter } from "next/navigation";
import { TOTPProps } from "@/types/auth.types";
import {
  handleClearStorage,
  handleResendForgotpasswordOtp,
  handleResendOtp,
  handleVerifyEmailOtp,
  handleVerifyForgotPasswordOtp,
} from "@/lib/functions/auth.functions";

const OTP = ({ userId, isSignup, setIsOpen, setVerifiedUserId }: TOTPProps) => {
  const router = useRouter();
  const [value, setValue] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const {
    isTimerRunning,
    countdown,
    formatTime,
    setIsTimerRunning,
    setCountdown,
    // checkOTPTimer,
  } = useTimer();

  const verifiedEmail: string | null = localStorage.getItem("verifiedEmail");
  const accountCreationUserId: string | null =
    localStorage.getItem("registerUserId");
  const isTimer = localStorage.getItem("countdown") === "00:00";

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    console.log(value, userId, "otp-val-userid");
    setIsSubmitting(true);
    if (value.length === 0) {
      setError("OTP Verification Code is Required");
      setIsSubmitting(false);
    } else if (value.length !== 6) {
      setError("OTP Verification Code must be 6 digits");
      setIsSubmitting(false);
    } else {
      setError(null);
      if (!isSignup && verifiedEmail) {
        // forgot password otp
        const verifyOtpEmailData = {
          email: verifiedEmail,
          otp: parseInt(value),
        };
        const response = await handleVerifyForgotPasswordOtp(
          verifyOtpEmailData,
          { userId: "", setIsOpen }
        );
        // parse the verified id prop to reset password modal
        if (setVerifiedUserId && response) {
          setVerifiedUserId(response);
        }
        if (!response) {
          setError("Invalid OTP");
          setIsTimerRunning(false);
        }
        setIsSubmitting(false);
      } else {
        // sign-up email otp verification and redirection to complete profile
        if (accountCreationUserId) {
          const formData = {
            userId,
            emailVerificationCode: parseInt(value),
            deviceId: "string",
            appVersion: "string",
          };
          const res = await handleVerifyEmailOtp(formData);
          if (res) {
            router.push("/complete-profile/");
          } else {
            setError("Invalid OTP");
            setIsTimerRunning(false);
          }
        }
        setIsSubmitting(false);
      }
    }
  };

  const handleOTPStates = () => {
    localStorage.setItem("countdown", "");
    setIsTimerRunning(true);
    setCountdown(1 * 40); // 10 min 10 * 60
    setError(null);
  };

  const handleResend = async () => {
    setValue("");
    if (!isSignup && verifiedEmail) {
      const res = await handleResendForgotpasswordOtp(verifiedEmail);
      if (res) {
        handleOTPStates();
      }
    } else if (accountCreationUserId) {
      const res = await handleResendOtp(accountCreationUserId);
      if (res) {
        handleOTPStates();
      }
    }
  };

  const handleCancel = async () => {
    await handleClearStorage();
    router.push("/sign-in");
  };

  return (
    <DialogContent className="flex max-w-96 flex-col items-center gap-3 rounded-xl border-none bg-dark-250 p-5">
      <DialogTitle className="h1-bold text-light-900">
        Verify Your Account
      </DialogTitle>
      <DialogDescription className="text-justify text-[12px] text-light-900">
        Check your inbox we have send an OTP verification code to your email.
        Please Enter the code to
        {isSignup ? " continue..." : " reset password"}
      </DialogDescription>
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

        {error && <p className="font-regular my-2 text-custom-100">{error}</p>}

        {!isTimer || isTimerRunning ? (
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

        <Button
          type="submit"
          className="shad-button_primary w-full"
          disabled={isSubmitting}
        >
          Submit
        </Button>

        <div className="flex-center mt-2 w-full gap-2 text-[13px] text-light-700">
          <h4>Didn&rsquo;t receive the code?</h4>
          <p onClick={handleResend} className="cursor-pointer text-primary-500">
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
  );
};

export default OTP;
