import { getProfilePostPageAction } from "@/actions/profile-feed.action";
import ProfilePostFeed from "@/components/widgets/profile/ProfilePostFeed";
import type { TProfileURLProps } from "@/types/utils.types";

export default async function ProfilePosts({ params }: TProfileURLProps) {
  const result = await getProfilePostPageAction(params.userId, "all", 1);
  return (
    <ProfilePostFeed
      key={params.userId + ":all"}
      profileId={params.userId}
      kind="all"
      initialResult={result}
    />
  );
}
