"use server";

import { getAuthHeaders, getSession } from "@/lib/session";
import { resolveViewerIdAction } from "./session.action";
import { getUserPersonalInfoAction } from "./auth.action";
import { revalidatePath } from "next/cache";
import { isRedirectError } from "next/dist/client/components/redirect";
import { talentRegistrationPayloadValidation } from "@/lib/utils/talent-registration";
import { profileEditPayloadValidation } from "@/lib/utils/profile-editor";

// import { TopPostCard } from "@/components/cards";

// async function resolveRouteUserId(userOrToken: string | undefined) {
//   const sessionToken = await getSession();

//   if (userOrToken && sessionToken && userOrToken === sessionToken) {
//     try {
//       const userRes = await getUserPersonalInfoAction(sessionToken);
//       return userRes?.response?._id || userOrToken;
//     } catch {
//       return userOrToken;
//     }
//   }

//   return userOrToken || "";
// }

// Resolves the userId from the route params corrected version

export async function resolveRouteUserId(
  userIdOrToken?: string,
): Promise<string | null> {
  if (!userIdOrToken) return null;

  const sessionToken = await getSession();

  // If route param is actually session token
  if (sessionToken && userIdOrToken === sessionToken) {
    try {
      const userRes = await getUserPersonalInfoAction(sessionToken);

      return userRes?.response?._id ?? null;
    } catch (error) {
      console.error("Failed to resolve user ID:", error);
      return null;
    }
  }

  // Already a real userId
  return userIdOrToken;
}

export const userPublicInfoAction = async (
  userId: string | undefined,
  _viewerId: string | undefined,
) => {
  try {
    const headers = await getAuthHeaders();
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_BACKEND_URL}/user/public/${userId}`,
      {
        cache: "no-store",
        headers,
      },
    );
    const res = await response.json();
    console.log(res, "userPublicInfoAction-response");
    return res;
  } catch (error) {
    console.error(error);
    return error;
  }
};

export async function fetchUserDataAction(userId: string, viewerId: string) {
  const token = await getSession();
  const resolvedViewerId = token ? await resolveViewerIdAction() : viewerId;

  let res;

  if (token) {
    if (resolvedViewerId === userId) {
      // If the viewer is the same as the userId, fetch personal info
      res = await getUserPersonalInfoAction(token);
    } else {
      // If the viewer is different, fetch public info
      console.log(
        "viewing public profile of another user -- user.action.ts --",
      );
      res = await userPublicInfoAction(userId, resolvedViewerId);
    }
  } else {
    // If no token, fetch public info
    res = await userPublicInfoAction(userId, viewerId);
  }

  if (res?.status === "7400") {
    return res.response || res;
  } else {
    return undefined;
  }
}

export async function editUserProfessionalInfoAction(
  formData: unknown,
  profileId: string,
  agreed = false,
) {
  const parsed = talentRegistrationPayloadValidation.safeParse(formData);
  if (!parsed.success || agreed !== true || !/^[a-f\d]{24}$/i.test(profileId))
    return {
      success: false,
      status: "400",
      message:
        "Check your registration details and accept the terms before submitting.",
    };
  try {
    const headers = await getAuthHeaders();
    const identityResponse = await fetch(
      `${process.env.NEXT_PUBLIC_BACKEND_URL}/user/`,
      { headers, cache: "no-store", signal: AbortSignal.timeout(15000) },
    );
    const identity = await identityResponse.json();
    if (
      !identityResponse.ok ||
      identity?.status !== "7400" ||
      identity.response?._id !== profileId ||
      typeof identity.response?.isTalent !== "boolean"
    )
      return {
        success: false,
        status: "400",
        message: "Unable to verify your account. Reload and try again.",
      };
    if (identity.response.isTalent)
      return {
        success: false,
        status: "400",
        message:
          "This account already has a talent profile. Open your profile to review it before making further changes.",
      };
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_BACKEND_URL}/user/professionalInfo`,
      {
        method: "PUT",
        cache: "no-store",
        headers: { ...headers, "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data),
        signal: AbortSignal.timeout(15000),
      },
    );
    const result = await response.json();
    if (!response.ok || result?.status !== "7400")
      return {
        success: false,
        status: "400",
        message:
          "Unable to create your talent profile. Your entries are still here; please try again.",
      };
    try {
      revalidatePath("/profile", "layout");
    } catch {}
    return {
      success: true,
      status: "7400",
      message: "Talent profile created.",
    };
  } catch (error) {
    if (isRedirectError(error)) throw error;
    return {
      success: false,
      status: "400",
      message:
        "Unable to create your talent profile. Your entries are still here; please try again.",
    };
  }
}

export async function userPersonalInfoEditAction(
  formData: unknown,
  profileId: string,
) {
  const parsed = profileEditPayloadValidation.safeParse(formData);
  if (!parsed.success || !/^[a-f\d]{24}$/i.test(profileId))
    return {
      status: "400",
      message: "Check your profile fields and photo URLs before saving.",
    };
  try {
    const headers = await getAuthHeaders();
    const identityResponse = await fetch(
      `${process.env.NEXT_PUBLIC_BACKEND_URL}/user/`,
      { headers, cache: "no-store", signal: AbortSignal.timeout(15000) },
    );
    const identity = await identityResponse.json();
    const current = identity?.response;
    if (
      !identityResponse.ok ||
      identity?.status !== "7400" ||
      current?._id !== profileId ||
      typeof current.isTalent !== "boolean" ||
      !current.personalInfo
    )
      return {
        status: "400",
        message: "Unable to verify your profile. Please reload and try again.",
      };
    if (parsed.data.moreInfo && !current.isTalent)
      return {
        status: "400",
        message: "Your profile type has changed. Reload before saving.",
      };
    const payload = {
      ...parsed.data,
      profileImage:
        parsed.data.profileImage ?? current.personalInfo.profileImage ?? "",
      coverImage:
        parsed.data.coverImage ?? current.personalInfo.coverImage ?? "",
      ...(parsed.data.moreInfo
        ? {
            moreInfo: {
              ...parsed.data.moreInfo,
              ...(parsed.data.moreInfo.ethnic === undefined &&
              current.morePersonalInfo?.ethnicId
                ? { ethnic: current.morePersonalInfo.ethnicId }
                : {}),
              ...(current.morePersonalInfo?._id
                ? { _id: current.morePersonalInfo._id }
                : {}),
            },
          }
        : {}),
    };
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_BACKEND_URL}/user/editPersonalInfo`,
      {
        method: "PUT",
        cache: "no-store",
        headers: {
          ...headers,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(15000),
      },
    );

    const res = await response.json();
    if (response.ok && res?.status === "7400") {
      try {
        revalidatePath("/profile", "layout");
      } catch {}
      return { status: "7400", message: "Profile updated successfully." };
    } else {
      const data = {
        status: "400",
        message: "Could not edit personal info data",
      };
      return data;
    }
  } catch (error) {
    if (isRedirectError(error)) throw error;
    return {
      status: "400",
      message:
        "Unable to update your profile. Your changes are still here; please try again.",
    };
  }
}

// edit & update

export async function editUserLanguageInfoAction({
  formData,
  path,
}: {
  formData: unknown;
  path: string;
}) {
  console.log(formData);
  try {
    const headers = await getAuthHeaders();
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_BACKEND_URL}/user/languages`,
      {
        method: "PUT",
        cache: "no-store",
        headers: {
          ...headers,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      },
    );

    const res = await response.json();
    if (res.status === "7400") {
      revalidatePath(path);
      return res;
    } else {
      const data = {
        status: 400,
        message: "Could not edit language data",
      };
      return data;
    }
  } catch {}
}

export async function editUserEducationInfoAction({
  formData,
  path,
}: {
  formData: unknown;
  path: string;
}) {
  console.log(formData);
  try {
    const headers = await getAuthHeaders();
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_BACKEND_URL}/user/educations`,
      {
        method: "PUT",
        cache: "no-store",
        headers: {
          ...headers,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      },
    );

    const res = await response.json();
    console.log("response-edit-education", res);
    if (res.status === "7400") {
      revalidatePath(path);
      return res;
    } else {
      const data = {
        status: 400,
        message: "Could not edit education data",
      };
      return data;
    }
  } catch {}
}
