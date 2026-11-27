"use client";

import {
  forgotPasswordAction,
  otpVerificationAction,
  resendOtpAction,
  verifyForgotPasswordAction,
} from "@/actions/auth.action";
import type {
  TVerifyForgotPasswordOtpProps,
  TVerifyOTPProps,
} from "@/types/auth.types";
import { browserPush } from "@/lib/browser-push-client";
import {
  clearCachedAuthUser,
  publishAuthSessionChange,
} from "@/lib/utils/auth-user-cache";
import { clearOtpSession } from "@/lib/utils/otp-session";

export async function handleClearStorage() {
  await browserPush.disconnect();
  clearCachedAuthUser();
  publishAuthSessionChange(null);
  clearOtpSession("signup");
  clearOtpSession("password");
  for (const key of [
    "countdown",
    "isOTP",
    "verifiedEmail",
    "registerUserId",
    "resetpassword",
    "token",
    "refreshToken",
  ]) {
    try {
      window.localStorage.removeItem(key);
    } catch {
      /* Optional browser storage. */
    }
  }
}

export async function handleVerifyEmailOtp(formData: TVerifyOTPProps) {
  const result = await otpVerificationAction(formData);
  return result?.status === "7400" &&
    "response" in result &&
    result.response.userId === formData.userId
    ? result.response.userId
    : false;
}

export async function handleResendOtp(userId: string) {
  return (await resendOtpAction(userId))?.status === "7400";
}

export async function handleForgotPassword(email: string) {
  return (await forgotPasswordAction(email))?.status === "7400" ? email : false;
}

export async function handleVerifyForgotPasswordOtp(
  formData: TVerifyForgotPasswordOtpProps,
) {
  const result = await verifyForgotPasswordAction(formData);
  return result?.status === "7400" &&
    typeof result.response === "string" &&
    result.response.trim()
    ? result.response
    : false;
}

export async function handleResendForgotpasswordOtp(email: string) {
  return (await forgotPasswordAction(email))?.status === "7400";
}
