"use server";

import SkillCard from "@/components/cards/SkillCard";
import { getAuthHeaders } from "@/lib/session";
import { getSession } from "./session.action";
import { IProfileSkills, ITopPost } from "@/types/profile.types";
import { getUserPersonalInfoAction } from "./auth.action";
import { resolveViewerIdAction } from "./tokenAndHeaders.action";
import { TopPostCard } from "@/components/cards";
import { revalidatePath } from "next/cache";

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
  userIdOrToken?: string
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
  _viewerId: string | undefined
) => {
  try {
    const headers = await getAuthHeaders();
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_BACKEND_URL}/user/public/${userId}`,
      {
        cache: "no-store",
        headers,
      }
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
        "viewing public profile of another user -- user.action.ts --"
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

export async function userTopPostInfoAction(
  userId: string | undefined,
  returnAsCard: boolean
) {
  try {
    const headers = await getAuthHeaders();
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_BACKEND_URL}/feeds/profile/best-work?viewUserId=${""}&userId=${userId}&pageNo=${1}&pageSize=${3}`,
      {
        cache: "no-store",
        headers,
      }
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
      }
    );
    const res = await response.json();
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
      }
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
      }
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
      }
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

export async function userPersonalInfoEditAction(formData: unknown) {
  console.log("formData", formData);
  try {
    const headers = await getAuthHeaders();
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_BACKEND_URL}/user/editPersonalInfo`,
      {
        method: "PUT",
        cache: "no-store",
        headers: {
          ...headers,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      }
    );

    const res = await response.json();
    console.log("// user-personal-info-edit //", res);

    if (res.status === "7400") {
      return res;
    } else {
      const data = {
        status: 400,
        message: "Could not edit personal info data",
      };
      return data;
    }
  } catch (error) {
    console.error("user-personal-edit error:", error);
    return {
      status: 500,
      message: "Internal server error - client side",
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
      }
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
      }
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
