import React from "react";
import { ProfileURLProps } from "../layout";
import { fetchUserDataAction, userSkillsInfoAction } from "@/actions/user.action";
import AlertNote from "@/components/others/AlertNote";
import { getCurrentChatUserAction } from "@/actions/chat.action";
import { getProfileVisibilityState } from "@/lib/utils/profilePrivacy";

async function Skills({ params }: ProfileURLProps) {
  const userData = await fetchUserDataAction(params.userId, params.username);
  const currentUser = await getCurrentChatUserAction();
  const isOwnProfile = currentUser?._id === params.userId;

  if (!userData) {
    return <AlertNote />;
  }

  const visibility = getProfileVisibilityState(userData, isOwnProfile);

  if (!visibility.canViewProfile) {
    return <p className="text-light-900">This user&apos;s profile details are private.</p>;
  }

  const data = await userSkillsInfoAction(params.userId);

  if (data?.status === 400) {
    return <AlertNote />;
  }

  return (
    <section className="my-8 grid w-full grid-cols-1 justify-end gap-8 md:grid-cols-2">
      {data.length > 0 ? data : <p className="text-light-900">NO DATA FOUND</p>}
    </section>
  );
}

export default Skills;
