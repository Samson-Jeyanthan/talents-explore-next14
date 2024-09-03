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
} from "@/components/cards/ProfessionalDetailCards";
import { TopPostCard } from "@/components/cards";

export const userPublicInfoAction = async (
  userId: string | undefined,
  viewerId: string | undefined
) => {
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_BACKEND_URL}/user/public/${userId}/${viewerId}`
    );
    return await response.json();
  } catch (error) {
    console.error(error);
    return error;
  }
};

export async function fetchUserDataAction(userId: string, viewerId: string) {
  const token = await getSession();

  let res;

  if (token) {
    if (token === userId) {
      res = await userPersonalInfoAction(userId);
    } else {
      res = await userPublicInfoAction(userId, token);
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

export async function userTopPostInfoAction(userId: string | undefined) {
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_BACKEND_URL}/feeds/profile/best-work?userId=${userId}&viewUserId=${""}&pageNo=${1}&pageSize=${3}`
    );
    const res = await response.json();
    if (res.status === "7400") {
      const data = res.response;
      return data.map((item: ITopPost, index: number) => (
        <TopPostCard key={item._id} userTopPostCard={item} index={index} />
      ));
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
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_BACKEND_URL}/user/skills/${userId}`
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
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_BACKEND_URL}/user/awardsOrCertificate/${userId}`
    );
    const res = await response.json();
    if (res.status === "7400") {
      const data = res.response;
      return data.map((item: IAwardsOrCertificate, index: number) => (
        <AwardCard key={item._id} userAwardCard={item} index={index} />
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
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_BACKEND_URL}/user/educations/${userId}`
    );
    const res = await response.json();
    if (res.status === "7400") {
      const data = res.response;
      return data.map((item: IEducation, index: number) => (
        <EducationCard key={item._id} userEducationCard={item} index={index} />
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
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_BACKEND_URL}/user/languages/${userId}`
    );
    const res = await response.json();
    if (res.status === "7400") {
      const data = res.response;
      return data.map((item: ILanguage, index: number) => (
        <LanguageCard key={item._id} userLangCard={item} index={index} />
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
