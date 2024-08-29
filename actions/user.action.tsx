"use server";

import SkillCard from "@/components/cards/SkillCard";
import { IProfileSkills } from "@/types/profile.types";
import { toast } from "sonner";

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
    // return res;
    if (res.status === "7400") {
      const data = res.response;
      return data.map((item: IProfileSkills, index: number) => (
        <SkillCard key={item._id} userSkillCard={item} index={index} />
      ));
    } else {
      toast.error("Could not fetch skill details", { duration: 4000 });
    }
  } catch {
    toast.error("Could not fetch skill details", { duration: 4000 });
  }
}
