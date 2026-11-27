"use server";

import axiosInstance from "@/lib/config/axiosInstance";
import { resetPasswordRequestValidation } from "@/lib/validations/password.validation";
import {
  createSession,
  getAuthHeaders,
  getRefreshToken,
  getSession,
} from "@/lib/session";
import { clearSession, storeIsAbout } from "./session.action";
import { signupRequestValidation } from "@/lib/validations/signup.validation";
import { isRedirectError } from "next/dist/client/components/redirect";
import { completeProfilePayloadValidation } from "@/lib/validations/complete-profile.validation";
import {
  signupOtpRequestValidation,
  passwordOtpRequestValidation,
  otpEmailValidation,
} from "@/lib/validations/otp.validation";
import { jwtDecode } from "jwt-decode";
import {
  signinRequestValidation,
  signinUserValidation,
} from "@/lib/validations/signin.validation";

export async function registerAction(formData: unknown) {
  const parsed = signupRequestValidation.safeParse(formData);
  if (!parsed.success)
    return { status: "7401", message: parsed.error.issues[0].message };
  const { email, password, userName } = parsed.data;
  try {
    const response = await axiosInstance.post("/auth/register", {
      email,
      password,
      userName,
    });
    return response.data;
  } catch (error) {
    const status = (error as { response?: { data?: { status?: string } } })
      ?.response?.data?.status;
    return {
      status: status === "7405" ? "7405" : "7500",
      message: "Unable to register right now. Please try again.",
    };
  }
}

export async function otpVerificationAction(formData: unknown) {
  const failure = {
    status: "400",
    message: "Unable to verify this code. Check it or request a new one.",
  };
  const parsed = signupOtpRequestValidation.safeParse(formData);
  if (!parsed.success) return failure;
  try {
    const response = await axiosInstance.post(
      "/auth/verifyEmailOtp",
      parsed.data,
      { timeout: 15000 },
    );
    const res = response.data;
    if (res?.status === "7400") {
      const tokens = res.response;
      if (
        typeof tokens?.accessToken !== "string" ||
        typeof tokens.refreshToken !== "string" ||
        !tokens.refreshToken.trim() ||
        jwtDecode<{ sub?: unknown }>(tokens.accessToken).sub !==
          parsed.data.userId
      )
        return failure;
      const result = await createSession(
        tokens.accessToken,
        tokens.refreshToken,
      );
      if (!result.success) return failure;
      await storeIsAbout(false);
      return { status: "7400", response: { userId: parsed.data.userId } };
    } else {
      return failure;
    }
  } catch {
    return failure;
  }
}

export async function resendOtpAction(userId: string) {
  if (!signupOtpRequestValidation.shape.userId.safeParse(userId).success)
    return {
      status: "400",
      message: "Please restart registration to request a code.",
    };
  try {
    const response = await axiosInstance.post(
      `/auth/resendOtp/${userId}`,
      undefined,
      { timeout: 15000 },
    );
    return response.data?.status === "7400"
      ? { status: "7400" }
      : {
          status: "400",
          message: "Unable to resend the code. Please try again.",
        };
  } catch {
    return {
      status: "400",
      message: "Unable to resend the code. Please try again.",
    };
  }
}

export async function completeProfileAction(formData: unknown) {
  const parsed = completeProfilePayloadValidation.safeParse(formData);
  if (!parsed.success) {
    return {
      status: "400",
      message: parsed.error.issues[0].message,
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }
  const failure = {
    status: "400",
    message:
      "Unable to create your profile. Your details are still here; please try again.",
  };
  try {
    const headers = await getAuthHeaders();
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_BACKEND_URL}/user/personalInfo/`,
      {
        method: "PUT",
        headers: { ...headers, "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data),
        signal: AbortSignal.timeout(15000),
      },
    );

    const res = await response.json().catch(() => null);

    if (response.ok && res?.status === "7400") {
      await storeIsAbout(true);

      const data = {
        status: "7400",
        response: "Profile updated successfully",
      };
      return data;
    }
    return failure;
  } catch (error) {
    if (isRedirectError(error)) throw error;
    return failure;
  }
}

// check for token
export async function checkForToken() {
  const token = await getSession();

  if (token === "") {
    return false;
  } else {
    return token;
  }
}

export async function deleteToken() {
  await clearSession();
}

export async function signinAction(formData: unknown) {
  const failure = (
    message = "Unable to sign in right now. Please try again.",
  ) => ({ status: "400" as const, message });
  const parsed = signinRequestValidation.safeParse(formData);
  if (!parsed.success)
    return failure("Enter a valid email address and password.");
  // One deadline covers login, the account lookup and response-body parsing.
  const signal = AbortSignal.timeout(15000);
  let sessionAttempted = false;
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_BACKEND_URL}/auth/login`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(parsed.data),
        signal,
        cache: "no-store",
      },
    );
    if (response.status === 401 || response.status === 403)
      return failure("Your email or password is incorrect. Please try again.");
    if (!response.ok)
      return failure(
        "The login service is temporarily unavailable. Please try again.",
      );
    const res = await response.json();
    if (res?.status !== "7400")
      return failure("Your email or password is incorrect. Please try again.");
    const tokens = res.response;
    if (
      typeof tokens?.accessToken !== "string" ||
      !tokens.accessToken.trim() ||
      typeof tokens.refreshToken !== "string" ||
      !tokens.refreshToken.trim()
    )
      return failure();
    const claims = jwtDecode<{ sub?: unknown; exp?: number }>(
      tokens.accessToken,
    );
    if (
      typeof claims.sub !== "string" ||
      typeof claims.exp !== "number" ||
      !Number.isFinite(claims.exp) ||
      claims.exp * 1000 <= Date.now()
    )
      return failure();

    const profileResponse = await fetch(
      `${process.env.NEXT_PUBLIC_BACKEND_URL}/user/`,
      {
        headers: { Authorization: `Bearer ${tokens.accessToken}` },
        cache: "no-store",
        signal,
      },
    );
    if (!profileResponse.ok)
      return failure(
        "Unable to load your account. Please try signing in again.",
      );
    const profile = await profileResponse.json();
    const user = signinUserValidation.safeParse(profile?.response);
    if (
      profile?.status !== "7400" ||
      !user.success ||
      user.data._id !== claims.sub
    )
      return failure();
    signal.throwIfAborted();
    sessionAttempted = true;
    const session = await createSession(
      tokens.accessToken,
      tokens.refreshToken,
    );
    if (!session.success) {
      await clearSession();
      return failure(
        "Unable to start your session. Please try signing in again.",
      );
    }
    await storeIsAbout(!!user.data.personalInfo.firstName);
    return { status: "7400" as const, response: user.data };
  } catch {
    if (sessionAttempted) {
      try {
        await clearSession();
      } catch {
        /* Best-effort rollback of partial cookie writes. */
      }
    }
    return failure(
      signal.aborted
        ? "Sign in timed out. Please check your connection and try again."
        : "Unable to connect or complete sign in. Please try again.",
    );
  }
}

export async function forgotPasswordAction(email: string) {
  const parsed = otpEmailValidation.safeParse(email);
  if (!parsed.success)
    return { status: "ERROR", message: "Enter a valid email address." };
  try {
    const response = await axiosInstance.post(
      `/auth/forgotPassword/${encodeURIComponent(parsed.data)}`,
      undefined,
      { timeout: 15000 },
    );
    return response.data;
  } catch (error) {
    return {
      status: "ERROR",
      message: "Unable to send a verification code. Please try again.",
    };
  }
}

export async function verifyForgotPasswordAction(formData: unknown) {
  const parsed = passwordOtpRequestValidation.safeParse(formData);
  if (!parsed.success)
    return {
      status: "ERROR",
      message: "Enter a valid email and 6-digit code.",
    };
  try {
    const response = await axiosInstance.post(
      "/auth/verifyForgotPassword",
      parsed.data,
      { timeout: 15000 },
    );
    return response.data;
  } catch (error) {
    return {
      status: "ERROR",
      message: "Unable to verify your code. Please try again.",
    };
  }
}

export async function resetPasswordAction(formData: unknown) {
  const parsed = resetPasswordRequestValidation.safeParse(formData);
  if (!parsed.success) {
    return {
      status: false,
      message: "Please verify your OTP and enter a valid new password.",
    };
  }
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_BACKEND_URL}/auth/resetPassword`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(parsed.data),
        signal: AbortSignal.timeout(15000),
      },
    );

    const result = await response.json();
    if (response.ok && result?.status === "7400") {
      return { status: true, message: "Password reset successfully." };
    }
    return {
      status: false,
      message:
        typeof result?.message === "string"
          ? result.message
          : "Unable to reset your password. Please verify your OTP and try again.",
    };
  } catch {
    return {
      status: false,
      message: "Unable to reset your password. Please try again.",
    };
  }
}

export async function getUserPersonalInfoAction(token: string | undefined) {
  let headers = {};
  if (token === undefined || token === "") {
    headers = await getAuthHeaders();
  }
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_BACKEND_URL}/user/`,
      {
        cache: "no-store",
        signal: AbortSignal.timeout(15000),
        headers:
          token === undefined || token === ""
            ? headers
            : {
                Authorization: `Bearer ${token}`,
              },
      },
    );
    const res = await response.json();

    return res;
  } catch (error: any) {
    console.error(
      "getUserPersonalInfoAction: //",
      error.response?.data || error.message,
    );
    throw error;
  }
}

export async function checkIsAboutAction(token: any) {
  const userDetailsRes = await getUserPersonalInfoAction(token);
  const userPersonalInfo = userDetailsRes?.response?.personalInfo;
  const userFirstName = userPersonalInfo?.firstName;

  if (userFirstName) {
    return true;
  } else {
    return false;
  }
}

export async function logoutAction(userId: string) {
  const refreshToken = await getRefreshToken();
  try {
    if (refreshToken) {
      const params = new URLSearchParams({
        userId,
        refresh_token: refreshToken,
        from_all: "true",
      });
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/auth/logout?${params}`,
        {
          method: "POST",
          cache: "no-store",
          headers: await getAuthHeaders(),
        },
      );
      console.log(res, "logout-action");
    }
  } finally {
    await clearSession();
  }
}
