import { fetchUserDataAction } from "@/actions/user.action";
import { getProfileSkillsAction } from "@/actions/profile-skills.action";
import ProfileSkillsList from "@/components/widgets/profile/ProfileSkillsList";
import AlertNote from "@/components/others/AlertNote";
import { getCurrentChatUserAction } from "@/actions/chat.action";
import { getProfileVisibilityState } from "@/lib/utils/profilePrivacy";
import { TProfileURLProps } from "@/types/utils.types";

async function Skills({ params }: TProfileURLProps) {
  const userData = await fetchUserDataAction(params.userId, params.username);
  const currentUser = await getCurrentChatUserAction();
  const isOwnProfile = currentUser?._id === params.userId;

  if (!userData) {
    return <AlertNote />;
  }

  const visibility = getProfileVisibilityState(userData, isOwnProfile);

  if (!visibility.canViewProfile) {
    return (
      <p className="text-light-900">
        This user&apos;s profile details are private.
      </p>
    );
  }

  const result = await getProfileSkillsAction(params.userId);

  return (
    <ProfileSkillsList
      profileId={params.userId}
      isOwnProfile={isOwnProfile}
      initialResult={result}
    />
  );
}

export default Skills;
