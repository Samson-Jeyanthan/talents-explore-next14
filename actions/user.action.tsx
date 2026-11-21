"use server";

import SkillCard from "@/components/cards/SkillCard";
import { getAuthHeaders, getSession } from "@/lib/session";
import { resolveViewerIdAction } from "./session.action";
import { IProfileSkills, ITopPost } from "@/types/profile.types";
import { getUserPersonalInfoAction } from "./auth.action";
import { TopPostCard } from "@/components/cards";
import { revalidatePath } from "next/cache";
import { isRedirectError } from "next/dist/client/components/redirect";
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

export async function editUserProfessionalInfoAction(formData: any) {
  try {
    const headers = await getAuthHeaders();
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_BACKEND_URL}/user/professionalInfo`,
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

    console.log("response_from_edit_action", res);

    if (res.status === "7400") {
      return { success: true, data: res };
    }

    console.error("Update talent profile failed:", response.status, res);
    return { success: false, status: response.status, error: res };
  } catch (error) {
    console.error("editUserProfessionalInfoAction error:", error);
    return { success: false, error: "Something went wrong" };
  }
}

export async function userTopPostInfoAction(
  userId: string | undefined,
  returnAsCard: boolean,
) {
  try {
    const headers = await getAuthHeaders();
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_BACKEND_URL}/feeds/profile/best-work?viewUserId=${""}&userId=${userId}&pageNo=${1}&pageSize=${3}`,
      {
        cache: "no-store",
        headers,
      },
    );

    const res = await response.json();

    if (res.status === "7400") {
      const data = res.response;
      if (returnAsCard) {
        return data.map((item: ITopPost, index: number) => (
          <TopPostCard key={item._id} userTopPostCard={item} index={index} />
        ));
      } else {
        const result = {
          status: 200,
          response: data,
        };
        return result;
      }
    } else {
      const data = {
        status: 400,
        message: "Could not fetch top post data",
      };
      return data;
    }
  } catch {}
}

export async function userSkillsInfoAction(userId: string | undefined) {
  try {
    const headers = await getAuthHeaders();
    const resolvedUserId = await resolveRouteUserId(userId);
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_BACKEND_URL}/user/skills/${resolvedUserId}`,
      {
        cache: "no-store",
        headers,
      },
    );
    const res = await response.json();
    console.log("skills-info", res.response[0]);
    console.log("skills-info", res.response[1]);

    if (res.status === "7400") {
      const data = res.response;
      return data.map((item: IProfileSkills, index: number) => (
        <SkillCard key={item._id} userSkillCard={item} index={index} />
      ));
    } else {
      const data = {
        status: 400,
        message: "Could not fetch skills data",
      };
      return data;
    }
  } catch {}
}

export async function getUserAwardInfoAction(userId: string | undefined) {
  try {
    const headers = await getAuthHeaders();
    const resolvedUserId = await resolveRouteUserId(userId);
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_BACKEND_URL}/user/awardsOrCertificate/${resolvedUserId}`,
      {
        cache: "no-store",
        headers,
      },
    );
    const res = await response.json();
    if (res.status === "7400") {
      const data = res.response;
      return data;
    } else {
      const data = {
        status: 400,
        message: "Could not fetch award data",
      };
      return data;
    }
  } catch {}
}

export async function getUserEducationInfoAction(userId: string | undefined) {
  try {
    const headers = await getAuthHeaders();
    const resolvedUserId = await resolveRouteUserId(userId);
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_BACKEND_URL}/user/educations/${resolvedUserId}`,
      {
        cache: "no-store",
        headers,
      },
    );
    const res = await response.json();
    if (res.status === "7400") {
      const data = res.response;
      return data;
    } else {
      const data = {
        status: 400,
        message: "Could not fetch education data",
      };
      return data;
    }
  } catch {}
}

export async function getUserLanguageInfoAction(userId: string | undefined) {
  try {
    const headers = await getAuthHeaders();
    const resolvedUserId = await resolveRouteUserId(userId);
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_BACKEND_URL}/user/languages/${resolvedUserId}`,
      {
        cache: "no-store",
        headers,
      },
    );
    const res = await response.json();
    if (res.status === "7400") {
      const data = res.response;
      return data;
    } else {
      const data = {
        status: 400,
        message: "Could not fetch language data",
      };
      return data;
    }
  } catch (error) {
    console.error("getUserLanguageInfoAction error:", error);

    return {
      status: 500,
      message: "Internal server error",
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
