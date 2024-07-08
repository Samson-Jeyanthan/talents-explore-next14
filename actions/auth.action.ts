"use server";

import axiosInstance from "@/lib/config/axiosInstance";

export const otpVerificationAction = async (formData: unknown) => {
  try {
    const response = await axiosInstance.post("/auth/verifyEmailOtp", formData);
    return response.data;
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
    return response.data;
  } catch (error) {
    console.error(error);
    return error;
  }
};

export const forgotPasswordAction = async (email: string | undefined) => {
  try {
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
