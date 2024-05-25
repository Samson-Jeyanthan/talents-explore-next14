import React from "react";

export type TSigninProps = {
  email: string;
  password: string;
  deviceId: string;
  appVersion: string;
};

type IsOpenState = {
  isFP: boolean;
  isOTP: boolean;
  isReset: boolean;
};

export type TOTPProps = {
  isSignup?: boolean;
  verifiedEmail?: string;
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
  email: string | undefined;
  otp: number;
};

export type TResetPasswordProps = {
  userId: string;
  newPassword: string;
};
