import { getProfileTopPostsAction } from "@/actions/profile-overview.action";
import ProfileTopPosts from "./ProfileTopPosts";

type Props = {
  params: { userId: string; username: string };
  isOwnProfile: boolean;
};
export default async function TopPosts({ params, isOwnProfile }: Props) {
  const result = await getProfileTopPostsAction(params.userId);
  return (
    <ProfileTopPosts
      profileId={params.userId}
      isOwnProfile={isOwnProfile}
      initialResult={result}
    />
  );
}
