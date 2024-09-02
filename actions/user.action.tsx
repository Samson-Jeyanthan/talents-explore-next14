"use server";

import SkillCard from "@/components/cards/SkillCard";
import { getSession } from "@/lib/session";
import { IProfileSkills } from "@/types/profile.types";
import { userPersonalInfoAction } from "./auth.action";

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
