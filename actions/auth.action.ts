"use server";

import axiosInstance from "@/lib/config/axiosInstance";
import {
  clearSession,
  createSession,
  getSession,
  storeIsAbout,
} from "@/lib/session";
import { getAuthHeaders } from "./tokenAndHeaders.action";

export const registerAction = async (formData: unknown) => {
  try {
    const response = await axiosInstance.post("/auth/register", formData);
    return response.data;
  } catch (error) {
    console.error(error);
    return error;
  }
};

export const otpVerificationAction = async (formData: unknown) => {
  try {
    const response = await axiosInstance.post("/auth/verifyEmailOtp", formData);
    const res = response.data;
    if (res?.status === "7400") {
      await storeIsAbout(false);
      const result = await createSession(
        res.response.accessToken,
        res.response.refreshToken
      );
      console.log(result, "result-access-token-isAbout");
      return res;
    } else {
      return false;
    }
  } catch (error) {
    console.error(error);
    return error;
  }
};

export const resendOtpAction = async (userId: string) => {
  try {
    const response = await axiosInstance.post(`/auth/resendOtp/${userId}`);
    return response.data;
  } catch (error) {
    console.error(error);
    return error;
  }
};

export const completeProfileAction = async (
  userId: string,
  formData: unknown
) => {
  try {
    const headers = await getAuthHeaders();
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_BACKEND_URL}/user/personalInfo/`,
      {
        method: "PUT",
        cache: "no-store",
        headers: {
          ...headers,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      }
    );

    const data = await response.json();
    return data;
  } catch (error) {
    console.error(error);
    return error;
  }
};

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
      }
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
          res.response.refreshToken
        );
      } else {
        await storeIsAbout(false);
        await createSession(
          res.response.accessToken,
          res.response.refreshToken
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

export const forgotPasswordAction = async (email: string) => {
  try {
    console.log(email, "email");
    const response = await axiosInstance.post(`/auth/forgotPassword/${email}`);
    return response.data;
  } catch (error) {
    console.error(error);
    return error;
  }
};

export const verifyForgotPasswordAction = async (formData: unknown) => {
  try {
    const response = await axiosInstance.post(
      "/auth/verifyForgotPassword",
      formData
    );
    return response.data;
  } catch (error) {
    console.error(error);
    return error;
  }
};

export const resetPasswordAction = async (formData: unknown) => {
  try {
    const response = await axiosInstance.post("/auth/resetPassword", formData);
    return response.data;
  } catch (error) {
    console.error(error);
    return error;
  }
};

export const getUserPersonalInfoAction = async (token: string | undefined) => {
  let headers = {};
  if (token === undefined || token === "") {
    headers = await getAuthHeaders();
    console.log(headers, "auth.action-headers");
  }
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_BACKEND_URL}/user/`,
      {
        cache: "no-store",
        headers:
          token === undefined || token === ""
            ? headers
            : {
                Authorization: `Bearer ${token}`,
              },
      }
    );
    const res = await response.json();

    console.log(res, "// getUserPersonalInfoAction //");
    return res;
  } catch (error: any) {
    console.error(
      "getUserPersonalInfoAction: //",
      error.response?.data || error.message
    );
    throw error;
  }
};

export const checkIsAboutAction = async (token: any) => {
  const userDetailsRes = await getUserPersonalInfoAction(token);
  const userPersonalInfo = userDetailsRes?.response?.personalInfo;
  const userFirstName = userPersonalInfo?.firstName;

  if (userFirstName) {
    return true;
  } else {
    return false;
  }
};

export const logoutAction = async (userId: string) => {
  const refreshToken = "";
  try {
    const response = await axiosInstance.post(
      `/auth/logout?userId=${userId}&refresh_token=${refreshToken}&from_all=true`
    );
    console.log(response, "logout res");
  } catch {}
};
