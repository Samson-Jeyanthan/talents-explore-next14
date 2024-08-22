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

export type ICurrentUser = {
  currentUserId: string;
  firstName: string;
  lastName: string;
  username: string;
  email: string;
  imageUrl: string | null;
  isTalent: boolean;
};

export type IContextType = {
  user: ICurrentUser;
  isLoading: boolean;
  setUser: React.Dispatch<React.SetStateAction<ICurrentUser>>;
  isAuthenticated: boolean;
  setIsAuthenticated: React.Dispatch<React.SetStateAction<boolean>>;
  checkAuthUser: () => void;
};
