import { getSession } from "@/lib/session";
import { ProfileURLProps } from "../layout";
import { getUserCreditPostsAction } from "@/actions/post.action";
import AlertNote from "@/components/others/AlertNote";
import { fetchUserDataAction } from "@/actions/user.action";
import { getCurrentChatUserAction } from "@/actions/chat.action";
import { getProfileVisibilityState } from "@/lib/utils/profilePrivacy";

async function Credits({ params }: ProfileURLProps) {
  const userData = await fetchUserDataAction(params.userId, params.username);
  const currentUser = await getCurrentChatUserAction();
  const isOwnProfile = currentUser?._id === params.userId;

  if (!userData) {
    return <AlertNote />;
  }

  const visibility = getProfileVisibilityState(userData, isOwnProfile);

  if (!visibility.canViewSharedPosts) {
    return <p className="text-light-900">This user&apos;s shared posts are private.</p>;
  }

  const token = await getSession();
  const data = await getUserCreditPostsAction(params.userId, token, 1, 5);

  if (data?.status === 400) {
    return <AlertNote />;
  }

  return <section className="my-8 flex flex-col gap-4">{data}</section>;
}

export default Credits;
