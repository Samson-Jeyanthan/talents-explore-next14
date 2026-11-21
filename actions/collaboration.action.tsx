"use server";

import axios from "axios";
import { getAuthHeaders as resolveSessionHeaders } from "@/lib/session";
import { jwtDecode } from "jwt-decode";
import { isRedirectError } from "next/dist/client/components/redirect";
import {
  collaborationId as idValidation,
  collaborationListValidation,
  collaborationListItems,
  applicantQueryValidation,
  applyCollaborationValidation,
  inviteResponseValidation,
  reviewApplicantValidation,
  bulkInviteValidation,
  type CollaborationListResult,
} from "@/lib/utils/collaboration";
import { workflowRows } from "@/lib/utils/collaboration-workflow";

const SUCCESS_STATUS = "7400";

type CollaborationTabType = "ALL" | "COMMITTED" | "RECEIVED" | "MY" | "APPLIED";

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
  const headers = await resolveSessionHeaders();
  const token = headers.Authorization.slice("Bearer ".length);
  const userId = jwtDecode<{ sub?: string }>(token).sub;
  if (!idValidation.safeParse(userId).success)
    throw new Error("Unable to identify your account. Please sign in again.");
  return { token, user: { _id: userId! } };
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

export async function getCurrentCollaborationUserAction() {
  try {
    const { token, user: viewer } = await getCurrentUserResponse();
    const response = await axios.get(
      `${process.env.NEXT_PUBLIC_BACKEND_URL}/user/`,
      { headers: getAuthHeaders(token), timeout: 15000 },
    );
    const user = response.data?.response;
    if (
      response.data?.status !== SUCCESS_STATUS ||
      !idValidation.safeParse(user?._id).success ||
      user._id !== viewer._id
    )
      throw new Error("Profile unavailable");
    return {
      _id: user._id,
      userName: user.userName,
      email: user.email,
      phone: user.phone,
      personalInfo: user.personalInfo,
    };
  } catch (error) {
    if (isRedirectError(error)) throw error;
    throw new Error(
      "Unable to load your collaboration profile. Please try again.",
    );
  }
}

export async function getCollaborationListAction(
  input: CollaborationListParams,
): Promise<CollaborationListResult> {
  const parsed = collaborationListValidation.safeParse(input);
  if (!parsed.success)
    return {
      status: "400",
      response: [],
      message: "Invalid collaboration filters or page.",
    };
  const { type, pageNo, pageSize, filters } = parsed.data;
  try {
    const { token, user } = await getCurrentUserResponse();
    const endpoint =
      type === "ALL"
        ? "/collaboration/open"
        : type === "MY"
          ? "/collaboration/my"
          : "/collaboration";
    const response = await axios.get(
      `${process.env.NEXT_PUBLIC_BACKEND_URL}${endpoint}`,
      {
        headers: getAuthHeaders(token),
        timeout: 15000,
        params: {
          pageNo,
          pageSize,
          ...(type !== "ALL" && type !== "MY"
            ? { applicantStatus: type, userId: user._id }
            : {}),
          ...Object.fromEntries(
            Object.entries(filters).map(([key, value]) => [
              key,
              toNullableValue(value),
            ]),
          ),
          keywords: filters.keywords || "",
        },
      },
    );
    const items =
      response.data?.status === SUCCESS_STATUS
        ? collaborationListItems(response.data)
        : null;
    return items
      ? { status: "7400", response: items }
      : {
          status: "400",
          response: [],
          message:
            typeof response.data?.message === "string" && response.data.message
              ? response.data.message
              : "Unable to load collaborations. Please try again.",
        };
  } catch (error) {
    if (isRedirectError(error)) throw error;
    return {
      status: "400",
      response: [],
      message: "Unable to load collaborations. Please try again.",
    };
  }
}

export async function getCollaborationDetailsAction(collaborationId: string) {
  if (!idValidation.safeParse(collaborationId).success) return null;
  try {
    const { token } = await getCurrentUserResponse();

    if (!token || !collaborationId) {
      return null;
    }

    const response = await axios.get(
      `${process.env.NEXT_PUBLIC_BACKEND_URL}/collaboration/${collaborationId}/details`,
      {
        headers: getAuthHeaders(token),
        timeout: 15000,
      },
    );

    return response.data?.status === SUCCESS_STATUS
      ? response.data?.response
      : null;
  } catch (error) {
    if (isRedirectError(error)) throw error;
    return null;
  }
}

export async function deleteCollaborationAction(collaborationId: string) {
  if (!idValidation.safeParse(collaborationId).success)
    return { status: "400", message: "Invalid collaboration." };
  try {
    const { token } = await getCurrentUserResponse();

    if (!token || !collaborationId) {
      return { status: "400", message: "Unauthorized" };
    }

    const response = await axios.delete(
      `${process.env.NEXT_PUBLIC_BACKEND_URL}/collaboration/${collaborationId}`,
      {
        headers: getAuthHeaders(token),
        timeout: 15000,
      },
    );

    return response.data;
  } catch (error) {
    if (isRedirectError(error)) throw error;
    return { status: "400", message: "Failed to delete collaboration" };
  }
}

export async function applyToCollaborationRoleAction(
  collaborationId: string,
  payload: {
    collaborationRoleId: string;
    applicantName: string;
    applicantEmail: string;
    applicantPhone?: string;
    message?: string;
    resumeFileUrl: string;
    resumeFileKey: string;
  },
) {
  if (!idValidation.safeParse(collaborationId).success)
    return { status: "400", message: "Invalid collaboration." };
  const valid = applyCollaborationValidation.safeParse(payload);
  if (!valid.success)
    return {
      status: "400",
      message: "Check the role and application details.",
    };
  payload = valid.data;
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
        timeout: 15000,
      },
    );

    return response.data;
  } catch (error) {
    if (isRedirectError(error)) throw error;
    return { status: "400", message: "Failed to send collaboration interest" };
  }
}

export async function respondCollaborationInviteAction(
  collaborationId: string,
  payload: {
    collaborationRoleId: string;
    action: "ACCEPT" | "DECLINE";
  },
) {
  if (!idValidation.safeParse(collaborationId).success)
    return { status: "400", message: "Invalid collaboration." };
  const valid = inviteResponseValidation.safeParse(payload);
  if (!valid.success)
    return { status: "400", message: "Invalid invitation response." };
  payload = valid.data;
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
        timeout: 15000,
      },
    );

    return response.data;
  } catch (error) {
    if (isRedirectError(error)) throw error;
    return { status: "400", message: "Failed to update invite response" };
  }
}

export async function getCollaborationApplicantsStatsAction(
  collaborationId: string,
) {
  if (!idValidation.safeParse(collaborationId).success) return null;
  try {
    const { token } = await getCurrentUserResponse();

    if (!token || !collaborationId) {
      return null;
    }

    const response = await axios.get(
      `${process.env.NEXT_PUBLIC_BACKEND_URL}/collaboration/${collaborationId}/stats`,
      {
        headers: getAuthHeaders(token),
        timeout: 15000,
      },
    );

    return response.data?.status === SUCCESS_STATUS
      ? response.data?.response
      : null;
  } catch (error) {
    if (isRedirectError(error)) throw error;
    return null;
  }
}

export async function getCollaborationApplicantsRoleStatsAction(
  collaborationId: string,
  roleId: string,
) {
  if (
    ![collaborationId, roleId].every(
      (value) => idValidation.safeParse(value).success,
    )
  )
    return null;
  try {
    const { token } = await getCurrentUserResponse();

    if (!token || !collaborationId || !roleId) {
      return null;
    }

    const response = await axios.get(
      `${process.env.NEXT_PUBLIC_BACKEND_URL}/collaboration/${collaborationId}/roles/${roleId}/stats`,
      {
        headers: getAuthHeaders(token),
        timeout: 15000,
      },
    );

    return response.data?.status === SUCCESS_STATUS
      ? response.data?.response
      : null;
  } catch (error) {
    if (isRedirectError(error)) throw error;
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
  }: CollaborationApplicantsParams = {},
) {
  if (
    !idValidation.safeParse(collaborationId).success ||
    !applicantQueryValidation.safeParse({
      pageNo,
      pageSize,
      search,
      roleId,
      filter,
    }).success
  )
    return {
      status: "400",
      response: [],
      message: "Invalid applicant filters or page.",
    };
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
        timeout: 15000,
        params: {
          pageNo,
          pageSize,
          search,
          roleId,
          filter,
        },
      },
    );

    const rows = workflowRows(response.data, "applicants");
    return response.data?.status === SUCCESS_STATUS && rows
      ? {
          status: SUCCESS_STATUS,
          response: rows,
          message: response.data?.message || "",
        }
      : {
          status: "400",
          response: [],
          message:
            response.data?.message ||
            "Unable to load applicants. Please try again.",
        };
  } catch (error) {
    if (isRedirectError(error)) throw error;
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
  },
) {
  if (
    !idValidation.safeParse(collaborationId).success ||
    !reviewApplicantValidation.safeParse(payload).success
  )
    return { status: "400", message: "Invalid applicant review." };
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
        timeout: 15000,
      },
    );

    return response.data;
  } catch (error) {
    if (isRedirectError(error)) throw error;
    return { status: "400", message: "Failed to review applicant" };
  }
}

export async function getCollaborationApplicantDetailsAction(
  collaborationId: string,
  applicationId: string,
) {
  if (
    ![collaborationId, applicationId].every(
      (value) => idValidation.safeParse(value).success,
    )
  )
    return null;
  try {
    const { token } = await getCurrentUserResponse();

    if (!token || !collaborationId || !applicationId) {
      return null;
    }

    const response = await axios.get(
      `${process.env.NEXT_PUBLIC_BACKEND_URL}/collaboration/${collaborationId}/applicants/${applicationId}`,
      {
        headers: getAuthHeaders(token),
        timeout: 15000,
      },
    );

    return response.data?.status === SUCCESS_STATUS
      ? response.data?.response
      : null;
  } catch (error) {
    if (isRedirectError(error)) throw error;
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
  if (
    !collaborationListValidation.safeParse({
      type: "ALL",
      pageNo,
      pageSize,
      filters: {
        mainCategoryId,
        subCategoryId,
        skillId,
        level,
        gender: userGender,
        languageId: userLanguage,
        ethnicId: ethnic,
        country,
        state,
        city,
        resultTime,
      },
    }).success ||
    typeof searchText !== "string" ||
    (profession != null && typeof profession !== "string") ||
    (userRating != null &&
      (typeof userRating !== "number" ||
        !Number.isFinite(userRating) ||
        userRating < 0 ||
        userRating > 5))
  )
    return {
      status: "400",
      response: [],
      message: "Invalid people filters or page.",
    };
  try {
    const { token, user } = await getCurrentUserResponse();

    if (!token || !user?._id) {
      return {
        status: "400",
        message: "Unauthorized",
        response: [],
      };
    }

    const response = await axios.get(
      `${process.env.NEXT_PUBLIC_BACKEND_URL}/search`,
      {
        headers: getAuthHeaders(token),
        timeout: 15000,
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
      },
    );

    const rows = workflowRows(response.data, "people");
    return response.data?.status === SUCCESS_STATUS && rows
      ? {
          status: SUCCESS_STATUS,
          response: rows,
          message: response.data?.message || "",
        }
      : {
          status: "400",
          response: [],
          message:
            response.data?.message ||
            "Unable to load people. Please try again.",
        };
  } catch (error) {
    if (isRedirectError(error)) throw error;
    return {
      status: "400",
      message: "Failed to search people",
      response: [],
    };
  }
}

export async function createCollaborationAction(payload: any) {
  if (
    !payload ||
    typeof payload !== "object" ||
    !payload.collaboration ||
    typeof payload.collaboration.title !== "string" ||
    !payload.collaboration.title.trim() ||
    !Array.isArray(payload.collaboratorRoles) ||
    !payload.collaboratorRoles.length
  )
    return {
      status: "400",
      message: "Enter a collaboration title and at least one role.",
    };
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
        timeout: 15000,
      },
    );

    return response.data;
  } catch (error) {
    if (isRedirectError(error)) throw error;
    return { status: "400", message: "Failed to create collaboration" };
  }
}

export async function updateCollaborationAction(
  collaborationId: string,
  payload: any,
) {
  if (
    !idValidation.safeParse(collaborationId).success ||
    !payload ||
    typeof payload !== "object" ||
    !payload.collaboration ||
    typeof payload.collaboration.title !== "string" ||
    !payload.collaboration.title.trim() ||
    (payload.deleteRoleIds &&
      (!Array.isArray(payload.deleteRoleIds) ||
        !payload.deleteRoleIds.every(
          (id: unknown) => idValidation.safeParse(id).success,
        ))) ||
    (payload.collaboratorRolesUpdate &&
      (!Array.isArray(payload.collaboratorRolesUpdate) ||
        !payload.collaboratorRolesUpdate.every(
          (role: any) => idValidation.safeParse(role?.roleId).success,
        )))
  )
    return {
      status: "400",
      message: "Check the collaboration and role details.",
    };
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
        timeout: 15000,
      },
    );

    return response.data;
  } catch (error) {
    if (isRedirectError(error)) throw error;
    return { status: "400", message: "Failed to update collaboration" };
  }
}

export async function invitePeopleToCollaborationAction(
  collaborationId: string,
  payload: { invites: any[] },
) {
  if (
    !idValidation.safeParse(collaborationId).success ||
    !bulkInviteValidation.safeParse(payload).success
  )
    return {
      status: "400",
      message: "Choose valid people and roles to invite.",
    };
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
        timeout: 15000,
      },
    );

    return response.data;
  } catch (error) {
    if (isRedirectError(error)) throw error;
    return { status: "400", message: "Failed to send invitations" };
  }
}
