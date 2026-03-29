"use server";

import SkillCard from "@/components/cards/SkillCard";
import { getSession } from "@/lib/session";
import {
  IAwardsOrCertificate,
  IEducation,
  ILanguage,
  IProfileSkills,
  ITopPost,
} from "@/types/profile.types";
import { userPersonalInfoAction } from "./auth.action";
import {
  AwardCard,
  EducationCard,
  LanguageCard,
} from "@/components/cards/ProDetailCards";
import { TopPostCard } from "@/components/cards";

async function getAuthHeaders() {
  const token = await getSession();

  return token
    ? {
        Authorization: `Bearer ${token}`,
      }
    : undefined;
}

async function resolveRouteUserId(userOrToken: string | undefined) {
  const sessionToken = await getSession();

  if (userOrToken && sessionToken && userOrToken === sessionToken) {
    try {
      const userRes = await userPersonalInfoAction(sessionToken);
      return userRes?.response?._id || userOrToken;
    } catch {
      return userOrToken;
    }
  }

  return userOrToken || "";
}

async function resolveViewerIdFromSession() {
  const sessionToken = await getSession();

  if (!sessionToken) {
    return "";
  }

  try {
    const userRes = await userPersonalInfoAction(sessionToken);
    return userRes?.response?._id || "";
  } catch {
    return "";
  }
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
  const resolvedViewerId = token ? await resolveViewerIdFromSession() : viewerId;

  let res;

  if (token) {
    if (resolvedViewerId === userId) {
      res = await userPersonalInfoAction(token);
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
      `${process.env.NEXT_PUBLIC_BACKEND_URL}/feeds/profile/best-work?userId=${userId}&viewUserId=${""}&pageNo=${1}&pageSize=${3}`,
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

export async function userLanguageInfoAction(userId: string | undefined) {
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
      return data.map((item: ILanguage, index: number) => (
        <LanguageCard
          key={item._id}
          userLangCard={item}
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

export async function userLanguageInfoUpdateAction() {}
