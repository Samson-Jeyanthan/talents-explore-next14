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
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_BACKEND_URL}/auth/login`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      },
    );

    const res = await response.json();

    if (res?.status === "7400") {
      //  check the user has complete the about section
      const accessToken = res.response.accessToken;
      const userDetailsRes = await getUserPersonalInfoAction(accessToken);

      const userPersonalInfo = userDetailsRes?.response?.personalInfo;
      const userFirstName = userPersonalInfo?.firstName;

      // store isAbout based on user's first name
      if (userFirstName) {
        await storeIsAbout(true);
        await createSession(
          res.response.accessToken,
          res.response.refreshToken,
        );
      } else {
        await storeIsAbout(false);
        await createSession(
          res.response.accessToken,
          res.response.refreshToken,
        );
      }

      return userDetailsRes;
    } else {
      return false;
    }
  } catch (error) {
    console.error(error);
    return error;
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
        // cache: "no-store",
        headers:
          token === undefined || token === ""
            ? headers
            : {
                Authorization: `Bearer ${token}`,
              },
      },
    );
    const res = await response.json();

    console.log(res, "// getUserPersonalInfoAction //");
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
