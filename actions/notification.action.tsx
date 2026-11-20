"use server";

import { getAuthHeaders } from "@/lib/session";
import { resolveViewerIdAction } from "./tokenAndHeaders.action";
import { isRedirectError } from "next/dist/client/components/redirect";
import {
  isNotificationId,
  normalizeNotifications,
  type NotificationPage,
} from "@/lib/utils/notifications";

async function request(path: string, method = "GET") {
  try {
    const headers = await getAuthHeaders();
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_BACKEND_URL}${path}`,
      {
        headers,
        method,
        cache: "no-store",
        signal: AbortSignal.timeout(15000),
      },
    );
    const data = await response.json();
    if (response.ok && data?.status === "7400")
      return { ...data, status: "7400" };
    return {
      status: response.ok ? data?.status || 400 : response.status,
      message:
        typeof data?.message === "string"
          ? data.message
          : "Unable to update notifications. Please try again.",
    };
  } catch (error) {
    if (isRedirectError(error)) throw error;
    return {
      status: 500,
      message: "Unable to reach notifications. Please try again.",
    };
  }
}

export async function getAllNotificationsAction(
  _userId: string | undefined,
  pageNo: number,
  pageSize: number,
): Promise<NotificationPage> {
  if (
    !Number.isSafeInteger(pageNo) ||
    pageNo < 1 ||
    !Number.isInteger(pageSize) ||
    pageSize < 1 ||
    pageSize > 100
  )
    return { success: false, message: "Invalid notification page." };
  const result = await request(
    `/notification?pageNumber=${pageNo}&pageSize=${pageSize}`,
  );
  const items =
    result.status === "7400" ? normalizeNotifications(result.response) : null;
  return items
    ? {
        success: true,
        data: items,
        hasMore: result.response.length >= pageSize,
      }
    : {
        success: false,
        message:
          result.message || "Unable to load notifications. Please try again.",
      };
}

async function mutate(
  method: string,
  read: boolean,
  notificationId: string | null,
) {
  if (notificationId !== null && !isNotificationId(notificationId))
    return { status: 400, message: "Invalid notification." };
  try {
    const viewerId = await resolveViewerIdAction();
    if (!viewerId) return { status: 401, message: "Please sign in again." };
    return await request(
      `/notification/${read ? "markAsRead/" : ""}${viewerId}${notificationId ? `/${notificationId}` : ""}`,
      method,
    );
  } catch (error) {
    if (isRedirectError(error)) throw error;
    return {
      status: 500,
      message: "Unable to update notifications. Please try again.",
    };
  }
}

export async function markNotificationAsReadAction(notificationId: string) {
  return mutate("PUT", true, notificationId);
}
export async function markAllNotificationsAsReadAction() {
  return mutate("PUT", true, null);
}
export async function deleteNotificationAction(notificationId: string) {
  return mutate("DELETE", false, notificationId);
}
export async function deleteAllNotificationsAction() {
  return mutate("DELETE", false, null);
}
