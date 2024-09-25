"use server";

import axiosInstance from "@/lib/config/axiosInstance";
import { createSession, storeIsAbout } from "@/lib/session";
import { jwtDecode } from "jwt-decode";

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
      const result = await createSession(res.response.accessToken);
      console.log(result, "result-access-token-isAbout-fsldr");
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
    const response = await axiosInstance.put(
      `/user/personalInfo/${userId}`,
      formData
    );
    return response.data;
  } catch (error) {
    console.error(error);
    return error;
  }
};

export const signinAction = async (formData: unknown) => {
  try {
    const response = await axiosInstance.post("/auth/login", formData);
    const res = response.data;
    if (res?.status === "7400") {
      //  check the user has complete the about section
      const decodedJWTToken = jwtDecode(res.response.accessToken);
      const userDetailsRes = await userPersonalInfoAction(decodedJWTToken?.sub);
      const userPersonalInfo = userDetailsRes?.response?.personalInfo;
      const userFirstName = userPersonalInfo?.firstName;
      console.log(userFirstName, "userFirstName");

      // store isAbout based on user's first name
      if (userFirstName) {
        await storeIsAbout(true);
        await createSession(res.response.accessToken);
      } else {
        await storeIsAbout(false);
        await createSession(res.response.accessToken);
      }

      return userDetailsRes; // returning user personal data
    } else {
      return false;
    }
  } catch (error) {
    console.error(error);
    return error;
  }
};

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

export const userPersonalInfoAction = async (userId: string | undefined) => {
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_BACKEND_URL}/user/${userId}`
    );
    return await response.json();
  } catch (error) {
    console.error(error);
    return error;
  }
};

export const checkIsAboutAction = async (token: any) => {
  const decodedJWTToken = jwtDecode(token);
  const userDetailsRes = await userPersonalInfoAction(decodedJWTToken?.sub);
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
      `/auth/logout?userId=${userId}&refreshToken=${refreshToken}&from_all={true}`
    );
    console.log(response, "logout res");
  } catch {}
};
