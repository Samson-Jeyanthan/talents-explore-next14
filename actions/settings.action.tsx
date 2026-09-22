"use server";

import axios from "axios";
import { getSession } from "@/lib/session";
import { getUserPersonalInfoAction } from "./auth.action";

type PrivacyPayload = Record<string, any>;

type NotificationPayload = {
  pushNotofication: boolean;
  quiteMode: boolean;
  quiteModeStartTime?: string | null;
  quiteModeEndTime?: string | null;
};

export type AdvertisementRequestPayload = {
  firstName: string;
  lastName: string;
  companyName: string;
  typeOfAdvertisement: string;
  targetAudience: string;
  preferredLocations: string;
  budget: string;
  startDate: string;
  finishDate: string;
  furtherDetails: string;
  contactInfo: string;
};

export type PaidPromotionRequestPayload = {
  firstName: string;
  lastName: string;
  dob: string;
  profession: string;
  teProfileUsername: string;
  skills: string;
  height: string;
  ethnic: string;
  language: string;
  location: string;
  previousExperience: string;
  availability: string;
  expectedPayPerPost: string;
  followersByPlatform: string;
  socialMediaLinks: string;
  contactInfo: string;
};

export type HelpSupportPayload = {
  name: string;
  email: string;
  accountType: string;
  priority: "Low" | "Medium" | "High";
  summary: string;
  description: string;
  attachmentUrl: string;
};

export type FeedbackPayload = {
  fullName: string;
  email: string;
  workingWell: string;
  improvements: string;
  attachmentUrl: string;
};

async function getAccessToken() {
  return await getSession();
}

function getAuthHeaders(token: string) {
  return {
    Authorization: `Bearer ${token}`,
    Accept: "application/json",
  };
}

async function getCurrentUser() {
  const token = await getAccessToken();

  if (!token) {
    return { token: "", user: null };
  }

  try {
    const userRes = await getUserPersonalInfoAction(token);
    return {
      token,
      user: userRes?.response || null,
    };
  } catch (error) {
    console.error("getCurrentUser settings failed:", error);
    return { token: "", user: null };
  }
}

export async function getCurrentSettingsUserAction() {
  const { user } = await getCurrentUser();
  return user || null;
}

async function getRequestList(path: string) {
  try {
    const token = await getAccessToken();
    if (!token) return [];

    const response = await axios.get(`${process.env.NEXT_PUBLIC_BACKEND_URL}/${path}`, {
      headers: getAuthHeaders(token),
    });
    const data = response.data;
    return data?.status === "7400" && Array.isArray(data?.response) ? data.response : [];
  } catch (error) {
    console.error(`get ${path} failed:`, error);
    return [];
  }
}

async function submitRequest(path: string, payload: Record<string, string>) {
  try {
    const token = await getAccessToken();
    if (!token) return { status: "7401", message: "Your session has expired. Please sign in again." };

    const response = await axios.post(`${process.env.NEXT_PUBLIC_BACKEND_URL}/${path}`, payload, {
      headers: { ...getAuthHeaders(token), "Content-Type": "application/json" },
    });
    return response.data;
  } catch (error: any) {
    return {
      status: "5000",
      message: error?.response?.data?.message || "Unable to submit your request",
    };
  }
}

export async function getAdvertisementRequestsAction() {
  return getRequestList("advertisement-request");
}

export async function submitAdvertisementRequestAction(payload: AdvertisementRequestPayload) {
  return submitRequest("advertisement-request", payload);
}

export async function getPaidPromotionRequestsAction() {
  return getRequestList("promo-request");
}

export async function submitPaidPromotionRequestAction(payload: PaidPromotionRequestPayload) {
  return submitRequest("promo-request", payload);
}

export async function submitHelpSupportAction(payload: HelpSupportPayload) {
  return submitRequest("help-support", payload);
}

export async function submitFeedbackAction(payload: FeedbackPayload) {
  return submitRequest("feedback", payload);
}

export async function getPrivacySettingsAction(accessToken?: string) {
  try {
    const token = accessToken || (await getCurrentUser()).token;

    if (!token) {
      return null;
    }

    const response = await axios.get(
      `${process.env.NEXT_PUBLIC_BACKEND_URL}/user/privacy`,
      {
        headers: getAuthHeaders(token),
      }
    );

    return response.data?.status === "7400" ? response.data?.response || null : null;
  } catch (error) {
    console.error("getPrivacySettingsAction failed:", error);
    return null;
  }
}

export async function updatePrivacySettingsAction(payload: PrivacyPayload) {
  try {
    const { token } = await getCurrentUser();

    if (!token) {
      return false;
    }

    const response = await axios.put(
      `${process.env.NEXT_PUBLIC_BACKEND_URL}/user/privacy`,
      payload,
      {
        headers: getAuthHeaders(token),
      }
    );

    return response.data;
  } catch (error) {
    console.error("updatePrivacySettingsAction failed:", error);
    return false;
  }
}

export async function updateSocialLinksPrivacyAction(payload: any[]) {
  try {
    const { token } = await getCurrentUser();

    if (!token) {
      return false;
    }

    const response = await axios.put(
      `${process.env.NEXT_PUBLIC_BACKEND_URL}/user/privacy/socialLinks`,
      payload,
      {
        headers: getAuthHeaders(token),
      }
    );

    return response.data;
  } catch (error) {
    console.error("updateSocialLinksPrivacyAction failed:", error);
    return false;
  }
}

export async function getNotificationSettingsAction(userId?: string, accessToken?: string) {
  try {
    const sessionUser = userId ? null : await getCurrentUser();
    const token = accessToken || sessionUser?.token || "";
    const currentUserId = userId || sessionUser?.user?._id;

    if (!token || !currentUserId) {
      return null;
    }

    const response = await axios.get(
      `${process.env.NEXT_PUBLIC_BACKEND_URL}/notification/settings/${currentUserId}`,
      {
        headers: getAuthHeaders(token),
      }
    );

    return response.data?.status === "7400" ? response.data?.response || null : null;
  } catch (error) {
    console.error("getNotificationSettingsAction failed:", error);
    return null;
  }
}

export async function updateNotificationSettingsAction(
  id: string,
  payload: NotificationPayload
) {
  try {
    const { token } = await getCurrentUser();

    if (!token || !id) {
      return false;
    }

    const response = await axios.put(
      `${process.env.NEXT_PUBLIC_BACKEND_URL}/notification/settings/${id}`,
      payload,
      {
        headers: getAuthHeaders(token),
      }
    );

    return response.data;
  } catch (error) {
    console.error("updateNotificationSettingsAction failed:", error);
    return false;
  }
}

export async function changePasswordSettingsAction(payload: {
  oldPassword: string;
  newPassword: string;
}) {
  try {
    const { token } = await getCurrentUser();

    if (!token) {
      return false;
    }

    const response = await axios.put(
      `${process.env.NEXT_PUBLIC_BACKEND_URL}/user/changePassword`,
      payload,
      {
        headers: getAuthHeaders(token),
      }
    );

    return response.data;
  } catch (error) {
    console.error("changePasswordSettingsAction failed:", error);
    return false;
  }
}

export async function deactivateAccountSettingsAction() {
  try {
    const { token } = await getCurrentUser();

    if (!token) {
      return false;
    }

    const response = await axios.delete(
      `${process.env.NEXT_PUBLIC_BACKEND_URL}/user/deactivateAccount`,
      {
        headers: getAuthHeaders(token),
      }
    );

    return response.data;
  } catch (error) {
    console.error("deactivateAccountSettingsAction failed:", error);
    return false;
  }
}

export async function deleteAccountSettingsAction() {
  try {
    const { token } = await getCurrentUser();

    if (!token) {
      return false;
    }

    const response = await axios.delete(
      `${process.env.NEXT_PUBLIC_BACKEND_URL}/user/deleteAccount`,
      {
        headers: getAuthHeaders(token),
      }
    );

    return response.data;
  } catch (error) {
    console.error("deleteAccountSettingsAction failed:", error);
    return false;
  }
}

export async function getSettingsActivityFeedAction(
  feedType: "deleted-post" | "deleted-share" | "star-post" | "star-share",
  pageNo = 1,
  pageSize = 12
) {
  try {
    const { token, user } = await getCurrentUser();

    if (!token || !user?._id) {
      return [];
    }

    const endpointMap = {
      "deleted-post": "/feeds/profile/deleted/post",
      "deleted-share": "/feeds/profile/deleted/share",
      "star-post": "/feeds/starRating/post",
      "star-share": "/feeds/starRating/shareLink",
    } as const;

    const response = await axios.get(
      `${process.env.NEXT_PUBLIC_BACKEND_URL}${endpointMap[feedType]}`,
      {
        headers: getAuthHeaders(token),
        params: {
          pageNo,
          pageSize,
          viewUserId: user._id,
        },
      }
    );

    return response.data?.status === "7400" && Array.isArray(response.data?.response)
      ? response.data.response
      : [];
  } catch (error) {
    console.error("getSettingsActivityFeedAction failed:", error);
    return [];
  }
}

export async function restoreDeletedPostSettingsAction(postId: string) {
  try {
    const { token } = await getCurrentUser();

    if (!token || !postId) {
      return false;
    }

    const response = await axios.put(
      `${process.env.NEXT_PUBLIC_BACKEND_URL}/te-post/restore/${postId}`,
      undefined,
      {
        headers: getAuthHeaders(token),
      }
    );

    return response.data;
  } catch (error) {
    console.error("restoreDeletedPostSettingsAction failed:", error);
    return false;
  }
}

export async function permanentlyDeletePostSettingsAction(postId: string) {
  try {
    const { token } = await getCurrentUser();

    if (!token || !postId) {
      return false;
    }

    const response = await axios.delete(
      `${process.env.NEXT_PUBLIC_BACKEND_URL}/te-post/permantely/${postId}`,
      {
        headers: getAuthHeaders(token),
      }
    );

    return response.data;
  } catch (error) {
    console.error("permanentlyDeletePostSettingsAction failed:", error);
    return false;
  }
}
