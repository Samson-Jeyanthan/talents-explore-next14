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

      // store isAbout based on userFirstName
      if (userFirstName) {
        const isAboutRes = await storeIsAbout(true);
        if (isAboutRes === 200) {
          const result = await createSession(res.response.accessToken);
          console.log(result, "result-access-token-isAbout-true", isAboutRes);
        }
      } else {
        const result = await createSession(res.response.accessToken);
        console.log(
          result,
          "no-token-result-access-token-isAbout-false",
          userFirstName
        );
      }
      return res;
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
    // const response = await axiosInstance.get(`/user/${userId}`);
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_BACKEND_URL}/user/${userId}`,
      {
        headers: {
          Authorization: `Bearer ${userId}`,
        },
      }
    );
    return await response.json();
  } catch (error) {
    console.error(error);
    return error;
  }
};
