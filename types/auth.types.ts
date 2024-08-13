import React from "react";

export type TSigninProps = {
  email: string;
  password: string;
  deviceId: string;
  appVersion: string;
};

export type IsOpenState = {
  isFP: boolean;
  isOTP: boolean;
  isReset: boolean;
};

export type TOTPProps = {
  userId: string;
  isSignup?: boolean;
  setVerifiedUserId?: (verifiedUserId: string) => void;
  setError?: (error: string) => void;
  setIsOpen?: React.Dispatch<React.SetStateAction<IsOpenState>>;
};

export type TVerifyOTPProps = {
  userId: string;
  emailVerificationCode: number;
  deviceId: string;
  appVersion: string;
};

export type TVerifyForgotPasswordOtpProps = {
  email: string;
  otp: number;
};
