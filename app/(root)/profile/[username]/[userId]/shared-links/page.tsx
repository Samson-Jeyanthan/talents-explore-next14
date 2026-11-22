import { getProfilePostPageAction } from "@/actions/profile-feed.action";
import ProfilePostFeed from "@/components/widgets/profile/ProfilePostFeed";
import type { TProfileURLProps } from "@/types/utils.types";

export default async function ProfileSharedLinks({ params }: TProfileURLProps) {
  const result = await getProfilePostPageAction(params.userId, "sharelink", 1);
  return (
    <ProfilePostFeed
      key={params.userId + ":sharelink"}
      profileId={params.userId}
      kind="sharelink"
      initialResult={result}
    />
  );
}
