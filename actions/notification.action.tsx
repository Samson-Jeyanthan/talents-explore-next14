"use server";

import axios from "axios";
import { getSession } from "@/lib/session";
import { getUserPersonalInfoAction } from "./auth.action";

async function getAccessToken() {
  return await getSession();
}

async function resolveCurrentUserId() {
  const token = await getAccessToken();

  if (!token) {
    return "";
  }

  try {
    const userRes = await getUserPersonalInfoAction(token);
    return userRes?.response?._id || "";
  } catch (error) {
    console.error("resolveCurrentUserId failed:", error);
    return "";
  }
}

function getAuthHeaders(token: string) {
  return {
    Authorization: `Bearer ${token}`,
  };
}

export async function getAllNotificationsAction(
  _userId: string | undefined,
  pageNo: number,
  pageSize: number
) {
  try {
    const token = await getAccessToken();

    if (!token) {
      return [];
    }

    const response = await axios.get(
      `${process.env.NEXT_PUBLIC_BACKEND_URL}/notification?pageNumber=${pageNo}&pageSize=${pageSize}`,
      {
        headers: getAuthHeaders(token),
      }
    );

    const res = response.data;

    if (res.status === "7400") {
      return Array.isArray(res.response) ? res.response : [];
    }

    return [];
  } catch (error) {
    // console.error("getAllNotificationsAction failed:", error);
    return [];
  }
}

export async function markNotificationAsReadAction(notificationId: string) {
  try {
    const token = await getAccessToken();
    const userId = await resolveCurrentUserId();

    if (!token || !userId) {
      return false;
    }

    const response = await axios.put(
      `${process.env.NEXT_PUBLIC_BACKEND_URL}/notification/markAsRead/${userId}/${notificationId}`,
      undefined,
      {
        headers: getAuthHeaders(token),
      }
    );

    return response.data;
  } catch (error) {
    console.error("markNotificationAsReadAction failed:", error);
    return false;
  }
}

export async function markAllNotificationsAsReadAction() {
  try {
    const token = await getAccessToken();
    const userId = await resolveCurrentUserId();

    if (!token || !userId) {
      return false;
    }

    const response = await axios.put(
      `${process.env.NEXT_PUBLIC_BACKEND_URL}/notification/markAsRead/${userId}`,
      undefined,
      {
        headers: getAuthHeaders(token),
      }
    );

    return response.data;
  } catch (error) {
    console.error("markAllNotificationsAsReadAction failed:", error);
    return false;
  }
}

export async function deleteNotificationAction(notificationId: string) {
  try {
    const token = await getAccessToken();
    const userId = await resolveCurrentUserId();

    if (!token || !userId) {
      return false;
    }

    const response = await axios.delete(
      `${process.env.NEXT_PUBLIC_BACKEND_URL}/notification/${userId}/${notificationId}`,
      {
        headers: getAuthHeaders(token),
      }
    );

    return response.data;
  } catch (error) {
    console.error("deleteNotificationAction failed:", error);
    return false;
  }
}

export async function deleteAllNotificationsAction() {
  try {
    const token = await getAccessToken();
    const userId = await resolveCurrentUserId();

    if (!token || !userId) {
      return false;
    }

    const response = await axios.delete(
      `${process.env.NEXT_PUBLIC_BACKEND_URL}/notification/${userId}`,
      {
        headers: getAuthHeaders(token),
      }
    );

    return response.data;
  } catch (error) {
    console.error("deleteAllNotificationsAction failed:", error);
    return false;
  }
}
