import { getProfileAwardsAction } from "@/actions/profile-awards.action";
import { getCurrentUserId } from "@/lib/session";
import { TProfileURLProps } from "@/types/utils.types";
import ProfileAwardsList from "./ProfileAwardsList";
export default async function AwardsAndCertificates({
  params,
}: TProfileURLProps) {
  const [viewer, result] = await Promise.all([
    getCurrentUserId(),
    getProfileAwardsAction(params.userId),
  ]);
  return (
    <ProfileAwardsList
      key={params.userId}
      profileId={params.userId}
      isOwnProfile={viewer === params.userId}
      initialResult={result}
    />
  );
}
