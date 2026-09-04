"use server";

import SkillCard from "@/components/cards/SkillCard";
import { getAuthHeaders, getSession } from "@/lib/session";
import {
  IAwardsOrCertificate,
  IEducation,
  // ILanguage,
  IProfileSkills,
  // ITopPost,
} from "@/types/profile.types";
import { getUserPersonalInfoAction } from "./auth.action";
import {
  AwardCard,
  EducationCard,
  // LanguageCard,
} from "@/components/cards/ProDetailCards";
import { resolveViewerIdAction } from "./tokenAndHeaders.action";
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
    return await response.json();
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
      res = await getUserPersonalInfoAction(token);
    } else {
      res = await userPublicInfoAction(userId, resolvedViewerId);
    }
  } else {
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

    console.log(res, "// top-post - 136 //");
    // if (res.status === "7400") {
    //   const data = res.response;
    //   if (returnAsCard) {
    //     return data.map((item: ITopPost, index: number) => (
    //       <TopPostCard key={item._id} userTopPostCard={item} index={index} />
    //     ));
    //   } else {
    //     const result = {
    //       status: 200,
    //       response: data,
    //     };
    //     return result;
    //   }
    // } else {
    //   const data = {
    //     status: 400,
    //     message: "Could not fetch top post data",
    //   };
    //   return data;
    // }
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

export async function userAwardInfoAction(userId: string | undefined) {
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
      return data.map((item: IAwardsOrCertificate, index: number) => (
        <AwardCard
          key={item._id}
          userAwardCard={item}
          index={index}
          length={data.length}
        />
      ));
    } else {
      const data = {
        status: 400,
        message: "Could not fetch award data",
      };
      return data;
    }
  } catch {}
}

export async function userEducationInfoAction(userId: string | undefined) {
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
      return data.map((item: IEducation, index: number) => (
        <EducationCard
          key={item._id}
          userEducationCard={item}
          index={index}
          length={data.length}
        />
      ));
    } else {
      const data = {
        status: 400,
        message: "Could not fetch education data",
      };
      return data;
    }
  } catch {}
}

export async function userLanguageInfoAction({
  userId,
}: {
  userId: string | undefined;
}) {
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
        message: "Could not fetch education data",
      };
      return data;
    }
  } catch (error) {
    console.error("userLanguageInfoAction error:", error);

    return {
      status: 500,
      message: "Internal server error",
    };
  }
}

export async function userPersonalInfoEditAction(formData: unknown) {
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
      return res.response;
    } else {
      return undefined;
    }
  } catch (error) {
    console.error("user-personal-edit error:", error);
    return {
      status: 500,
      message: "Internal server error",
    };
  }
}
