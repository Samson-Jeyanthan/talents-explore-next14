"use client";

import {
  forgotPasswordAction,
  otpVerificationAction,
  resendOtpAction,
  verifyForgotPasswordAction,
} from "@/actions/auth.action";

import {
  TOTPProps,
  TVerifyForgotPasswordOtpProps,
  TVerifyOTPProps,
} from "@/types/auth.types";
import { jwtDecode } from "jwt-decode";
import { toast } from "sonner";
import { deleteSession, verifySession } from "../session";

// signup otp function
export async function handleVerifyEmailOtp(formData: TVerifyOTPProps) {
  const res = await otpVerificationAction(formData);
  console.log(res);
  if (res?.status === "7400") {
    toast.success("Credentials Verified");
    const decodeToken = jwtDecode(res.response.accessToken);
    await handleClearStorage();
    return decodeToken.sub;
  } else {
    toast.error("OTP Verification Failed");
    return false;
  }
}

// request for resend otp when registering the user
export async function handleResendOtp(userId: string) {
  const res = await resendOtpAction(userId);
  if (res?.status === "7400") {
    toast.success("OTP Has Send to Your Email", { duration: 4000 });
    return true;
  } else {
    toast.error("Couldn't Find Your Email Address", {
      duration: 4000,
    });
    return false;
  }
}

// request for forgot password otp
export async function handleForgotPassword(
  email: string,
  { setError, setIsOpen }: TOTPProps
) {
  const res = await forgotPasswordAction(email);
  console.log(res);
  if (res?.status === "7400") {
    localStorage.setItem("isOTP", "true");
    if (setIsOpen) {
      setIsOpen((prevState: any) => ({
        ...prevState,
        isFP: false,
        isOTP: true,
      }));
    }
    toast.success("OTP Has Send to Your Email", { duration: 4000 });
    return email;
  } else {
    if (setError) {
      setError("Invalid Email Address");
    }
    toast.error("Couldn't Find Your Email Address", {
      duration: 4000,
    });
    return false;
  }
}

// otp verification for forgot password
export async function handleVerifyForgotPasswordOtp(
  formData: TVerifyForgotPasswordOtpProps,
  { setIsOpen }: TOTPProps
) {
  const res = await verifyForgotPasswordAction(formData);
  console.log(res);
  if (res?.status === "7400") {
    toast.success("Credentials Verified");
    if (setIsOpen) {
      setIsOpen((prevState: any) => ({
        ...prevState,
        isOTP: false,
        isReset: true,
      }));
    }
    localStorage.setItem("resetpassword", "true");
    localStorage.removeItem("countdown");
    localStorage.removeItem("isOTP");
    return res?.response;
  } else {
    toast.error("OTP Verification Failed");
    if (setIsOpen) {
      setIsOpen((prevState) => ({
        ...prevState,
        isOTP: true,
      }));
    }
    return false;
  }
}

// request to resend otp for forgot password
export async function handleResendForgotpasswordOtp(email: string) {
  const res = await forgotPasswordAction(email);
  console.log(res);
  if (res?.status === "7400") {
    toast.success("OTP Has Resend to Your Email", { duration: 4000 });
    return true;
  } else {
    toast.error("Couldn't Send OTP, Please Try Again", {
      duration: 4000,
    });
    return false;
  }
}

// removing localstorage items when canceling the forgot password function
export async function handleClearStorage() {
  localStorage.removeItem("countdown");
  localStorage.removeItem("isOTP");
  localStorage.removeItem("verifiedEmail");
  localStorage.removeItem("registerUserId");
}

// logout function
export async function handleLogout() {
  await deleteSession();
  localStorage.clear();
}

// check for token
export async function checkForToken() {
  const token = await verifySession();
  const decodedJWTToken = jwtDecode(token);
  return decodedJWTToken?.sub;
}
