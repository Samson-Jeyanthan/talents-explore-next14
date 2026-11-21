import { getProfileLanguagesAction } from "@/actions/profile-overview.action";
import { getProfileEducationsAction } from "@/actions/profile-education.action";
import { getCurrentUserId } from "@/lib/session";
import ProfileLanguageEducation from "./ProfileLanguageEducation";
import type { TProfileURLProps } from "@/types/utils.types";

export default async function LanguageEducationDetails({
  params,
}: TProfileURLProps) {
  const [currentUserId, languages, education] = await Promise.all([
    getCurrentUserId(),
    getProfileLanguagesAction(params.userId),
    getProfileEducationsAction(params.userId),
  ]);
  return (
    <ProfileLanguageEducation
      profileId={params.userId}
      isOwnProfile={currentUserId === params.userId}
      initialLanguages={languages}
      initialEducation={education}
    />
  );
}
