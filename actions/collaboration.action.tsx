"use server";

import axios from "axios";
import { getSession } from "@/lib/session";
import { getUserPersonalInfoAction } from "./auth.action";

const SUCCESS_STATUS = "7400";

type CollaborationTabType =
  | "ALL"
  | "COMMITTED"
  | "RECEIVED"
  | "MY"
  | "APPLIED";

type CollaborationFilters = {
  keywords?: string;
  mainCategoryId?: string | null;
  subCategoryId?: string | null;
  skillId?: string | null;
  level?: string | null;
  gender?: string | null;
  languageId?: string | null;
  ethnicId?: string | null;
  country?: string | null;
  state?: string | null;
  city?: string | null;
  resultTime?: string | null;
};

type CollaborationListParams = {
  type: CollaborationTabType;
  pageNo?: number;
  pageSize?: number;
  filters?: CollaborationFilters;
};

type CollaborationApplicantsParams = {
  pageNo?: number;
  pageSize?: number;
  search?: string;
  roleId?: string | null;
  filter?: string;
};

type CollaborationPeopleSearchParams = {
  pageNo?: number;
  pageSize?: number;
  searchText?: string;
  userRating?: number | null;
  mainCategoryId?: string | null;
  subCategoryId?: string | null;
  skillId?: string | null;
  level?: string | null;
  profession?: string | null;
  userGender?: string | null;
  userLanguage?: string | null;
  ethnic?: string | null;
  country?: string | null;
  state?: string | null;
  city?: string | null;
  resultTime?: string | null;
};

async function getCurrentUserResponse() {
  const token = await getSession();

  if (!token) {
    return { token: "", user: null };
  }

  try {
    const response = await getUserPersonalInfoAction(token);
    return {
      token,
      user: response?.response || null,
    };
  } catch (error) {
    console.error("getCurrentUserResponse failed for collaboration:", error);
    return { token: "", user: null };
  }
}

function getAuthHeaders(token: string) {
  return {
    Authorization: `Bearer ${token}`,
  };
}

function toNullableValue(value: unknown) {
  if (value === undefined || value === null || value === "") {
    return null;
  }

  return value;
}

function normalizeListResponse(responseData: any) {
  if (Array.isArray(responseData?.response)) {
    return responseData.response;
  }

  if (Array.isArray(responseData?.response?.list)) {
    return responseData.response.list;
  }

  if (Array.isArray(responseData?.data)) {
    return responseData.data;
  }

  return [];
}

export async function getCurrentCollaborationUserAction() {
  const { user } = await getCurrentUserResponse();
  return user || null;
}

export async function getCollaborationListAction({
  type,
  pageNo = 1,
  pageSize = 20,
  filters = {},
}: CollaborationListParams) {
  try {
    const { token, user } = await getCurrentUserResponse();

    if (!token || !user?._id) {
      return {
        status: "400",
        message: "Unauthorized",
        response: [],
      };
    }

    const endpoint =
      type === "ALL"
        ? "/collaboration/open"
        : type === "MY"
          ? "/collaboration/my"
          : "/collaboration";

    const params = {
      pageNo,
      pageSize,
      ...(type !== "ALL" && type !== "MY"
        ? {
            applicantStatus: type,
            userId: user._id,
          }
        : {}),
      keywords: filters.keywords || "",
      mainCategoryId: toNullableValue(filters.mainCategoryId),
      subCategoryId: toNullableValue(filters.subCategoryId),
      skillId: toNullableValue(filters.skillId),
      level: toNullableValue(filters.level),
      gender: toNullableValue(filters.gender),
      languageId: toNullableValue(filters.languageId),
      ethnicId: toNullableValue(filters.ethnicId),
      country: toNullableValue(filters.country),
      state: toNullableValue(filters.state),
      city: toNullableValue(filters.city),
      resultTime: toNullableValue(filters.resultTime),
    };

    const response = await axios.get(
      `${process.env.NEXT_PUBLIC_BACKEND_URL}${endpoint}`,
      {
        headers: getAuthHeaders(token),
        params,
      }
    );

    return {
      status: response.data?.status || "400",
      message: response.data?.message || "",
      response: normalizeListResponse(response.data),
    };
  } catch (error) {
    console.error("getCollaborationListAction failed:", error);
    return {
      status: "400",
      message: "Failed to fetch collaboration list",
      response: [],
    };
  }
}

export async function getCollaborationDetailsAction(collaborationId: string) {
  try {
    const { token } = await getCurrentUserResponse();

    if (!token || !collaborationId) {
      return null;
    }

    const response = await axios.get(
      `${process.env.NEXT_PUBLIC_BACKEND_URL}/collaboration/${collaborationId}/details`,
      {
        headers: getAuthHeaders(token),
      }
    );

    return response.data?.status === SUCCESS_STATUS ? response.data?.response : null;
  } catch (error) {
    console.error("getCollaborationDetailsAction failed:", error);
    return null;
  }
}

export async function deleteCollaborationAction(collaborationId: string) {
  try {
    const { token } = await getCurrentUserResponse();

    if (!token || !collaborationId) {
      return { status: "400", message: "Unauthorized" };
    }

    const response = await axios.delete(
      `${process.env.NEXT_PUBLIC_BACKEND_URL}/collaboration/${collaborationId}`,
      {
        headers: getAuthHeaders(token),
      }
    );

    return response.data;
  } catch (error) {
    console.error("deleteCollaborationAction failed:", error);
    return { status: "400", message: "Failed to delete collaboration" };
  }
}

export async function applyToCollaborationRoleAction(
  collaborationId: string,
  payload: {
    collaborationRoleId: string;
    applicantName?: string;
    applicantEmail?: string;
    applicantPhone?: string;
    message?: string;
    resumeFileUrl?: string;
    resumeFileKey?: string;
  }
) {
  try {
    const { token } = await getCurrentUserResponse();

    if (!token || !collaborationId || !payload?.collaborationRoleId) {
      return { status: "400", message: "Unauthorized" };
    }

    const response = await axios.post(
      `${process.env.NEXT_PUBLIC_BACKEND_URL}/collaboration/${collaborationId}/apply`,
      payload,
      {
        headers: getAuthHeaders(token),
      }
    );

    return response.data;
  } catch (error) {
    console.error("applyToCollaborationRoleAction failed:", error);
    return { status: "400", message: "Failed to send collaboration interest" };
  }
}

export async function respondCollaborationInviteAction(
  collaborationId: string,
  payload: {
    collaborationRoleId: string;
    action: "ACCEPT" | "DECLINE";
  }
) {
  try {
    const { token } = await getCurrentUserResponse();

    if (!token || !collaborationId || !payload?.collaborationRoleId) {
      return { status: "400", message: "Unauthorized" };
    }

    const response = await axios.patch(
      `${process.env.NEXT_PUBLIC_BACKEND_URL}/collaboration/${collaborationId}/invite/respond`,
      payload,
      {
        headers: getAuthHeaders(token),
      }
    );

    return response.data;
  } catch (error) {
    console.error("respondCollaborationInviteAction failed:", error);
    return { status: "400", message: "Failed to update invite response" };
  }
}

export async function getCollaborationApplicantsStatsAction(collaborationId: string) {
  try {
    const { token } = await getCurrentUserResponse();

    if (!token || !collaborationId) {
      return null;
    }

    const response = await axios.get(
      `${process.env.NEXT_PUBLIC_BACKEND_URL}/collaboration/${collaborationId}/stats`,
      {
        headers: getAuthHeaders(token),
      }
    );

    return response.data?.status === SUCCESS_STATUS ? response.data?.response : null;
  } catch (error) {
    console.error("getCollaborationApplicantsStatsAction failed:", error);
    return null;
  }
}

export async function getCollaborationApplicantsRoleStatsAction(
  collaborationId: string,
  roleId: string
) {
  try {
    const { token } = await getCurrentUserResponse();

    if (!token || !collaborationId || !roleId) {
      return null;
    }

    const response = await axios.get(
      `${process.env.NEXT_PUBLIC_BACKEND_URL}/collaboration/${collaborationId}/roles/${roleId}/stats`,
      {
        headers: getAuthHeaders(token),
      }
    );

    return response.data?.status === SUCCESS_STATUS ? response.data?.response : null;
  } catch (error) {
    console.error("getCollaborationApplicantsRoleStatsAction failed:", error);
    return null;
  }
}

export async function getCollaborationApplicantsAction(
  collaborationId: string,
  {
    pageNo = 1,
    pageSize = 20,
    search = "",
    roleId = null,
    filter = "ALL",
  }: CollaborationApplicantsParams = {}
) {
  try {
    const { token } = await getCurrentUserResponse();

    if (!token || !collaborationId) {
      return {
        status: "400",
        message: "Unauthorized",
        response: [],
      };
    }

    const response = await axios.get(
      `${process.env.NEXT_PUBLIC_BACKEND_URL}/collaboration/${collaborationId}/applicants`,
      {
        headers: getAuthHeaders(token),
        params: {
          pageNo,
          pageSize,
          search,
          roleId,
          filter,
        },
      }
    );

    return {
      status: response.data?.status || "400",
      message: response.data?.message || "",
      response: normalizeListResponse(response.data),
    };
  } catch (error) {
    console.error("getCollaborationApplicantsAction failed:", error);
    return {
      status: "400",
      message: "Failed to fetch applicants",
      response: [],
    };
  }
}

export async function reviewCollaborationApplicantAction(
  collaborationId: string,
  payload: {
    collaborationRoleId: string;
    applicantId: string;
    action: string;
  }
) {
  try {
    const { token } = await getCurrentUserResponse();

    if (!token || !collaborationId || !payload?.collaborationRoleId) {
      return { status: "400", message: "Unauthorized" };
    }

    const response = await axios.patch(
      `${process.env.NEXT_PUBLIC_BACKEND_URL}/collaboration/${collaborationId}/applicants/review`,
      payload,
      {
        headers: getAuthHeaders(token),
      }
    );

    return response.data;
  } catch (error) {
    console.error("reviewCollaborationApplicantAction failed:", error);
    return { status: "400", message: "Failed to review applicant" };
  }
}

export async function getCollaborationApplicantDetailsAction(
  collaborationId: string,
  applicationId: string
) {
  try {
    const { token } = await getCurrentUserResponse();

    if (!token || !collaborationId || !applicationId) {
      return null;
    }

    const response = await axios.get(
      `${process.env.NEXT_PUBLIC_BACKEND_URL}/collaboration/${collaborationId}/applicants/${applicationId}`,
      {
        headers: getAuthHeaders(token),
      }
    );

    return response.data?.status === SUCCESS_STATUS ? response.data?.response : null;
  } catch (error) {
    console.error("getCollaborationApplicantDetailsAction failed:", error);
    return null;
  }
}

export async function searchCollaborationPeopleAction({
  pageNo = 1,
  pageSize = 20,
  searchText = "",
  userRating = null,
  mainCategoryId = null,
  subCategoryId = null,
  skillId = null,
  level = null,
  profession = null,
  userGender = null,
  userLanguage = null,
  ethnic = null,
  country = null,
  state = null,
  city = null,
  resultTime = null,
}: CollaborationPeopleSearchParams = {}) {
  try {
    const { token, user } = await getCurrentUserResponse();

    if (!token || !user?._id) {
      return {
        status: "400",
        message: "Unauthorized",
        response: [],
      };
    }

    const response = await axios.get(`${process.env.NEXT_PUBLIC_BACKEND_URL}/search`, {
      headers: getAuthHeaders(token),
      params: {
        pageSize,
        pageNo,
        viewUserId: user._id,
        searchType: "TALENT",
        searchText,
        userRating,
        mainCategoryId,
        subCategoryId,
        skillId,
        level,
        profession,
        userGender,
        userLanguage,
        ethnic,
        country,
        state,
        city,
        resultTime,
      },
    });

    return {
      status: response.data?.status || "400",
      message: response.data?.message || "",
      response: normalizeListResponse(response.data),
    };
  } catch (error) {
    console.error("searchCollaborationPeopleAction failed:", error);
    return {
      status: "400",
      message: "Failed to search people",
      response: [],
    };
  }
}

export async function createCollaborationAction(payload: any) {
  try {
    const { token } = await getCurrentUserResponse();

    if (!token) {
      return { status: "400", message: "Unauthorized" };
    }

    const response = await axios.post(
      `${process.env.NEXT_PUBLIC_BACKEND_URL}/collaboration`,
      payload,
      {
        headers: getAuthHeaders(token),
      }
    );

    return response.data;
  } catch (error) {
    console.error("createCollaborationAction failed:", error);
    return { status: "400", message: "Failed to create collaboration" };
  }
}

export async function updateCollaborationAction(collaborationId: string, payload: any) {
  try {
    const { token } = await getCurrentUserResponse();

    if (!token || !collaborationId) {
      return { status: "400", message: "Unauthorized" };
    }

    const response = await axios.patch(
      `${process.env.NEXT_PUBLIC_BACKEND_URL}/collaboration/${collaborationId}`,
      payload,
      {
        headers: getAuthHeaders(token),
      }
    );

    return response.data;
  } catch (error) {
    console.error("updateCollaborationAction failed:", error);
    return { status: "400", message: "Failed to update collaboration" };
  }
}

export async function invitePeopleToCollaborationAction(
  collaborationId: string,
  payload: { invites: any[] }
) {
  try {
    const { token } = await getCurrentUserResponse();

    if (!token || !collaborationId) {
      return { status: "400", message: "Unauthorized" };
    }

    const response = await axios.post(
      `${process.env.NEXT_PUBLIC_BACKEND_URL}/collaboration/${collaborationId}/invite/bulk`,
      payload,
      {
        headers: getAuthHeaders(token),
      }
    );

    return response.data;
  } catch (error) {
    console.error("invitePeopleToCollaborationAction failed:", error);
    return { status: "400", message: "Failed to send invitations" };
  }
}
