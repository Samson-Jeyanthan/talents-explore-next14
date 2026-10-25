import { getUserAllPostsAction } from "@/actions/post.action";
import { getSession } from "@/lib/session";
import { TProfileURLProps } from "@/types/utils.types";
import AlertNote from "@/components/others/AlertNote";
import { fetchUserDataAction } from "@/actions/user.action";
import { getCurrentChatUserAction } from "@/actions/chat.action";
import { getProfileVisibilityState } from "@/lib/utils/profilePrivacy";
import { CameraIcon } from "@/public/assets/svgs";
import { EmptyDetails } from "@/components/others";

async function AllPosts({ params }: TProfileURLProps) {
  const userData = await fetchUserDataAction(params.userId, params.username);
  const currentUser = await getCurrentChatUserAction();
  const isOwnProfile = currentUser?._id === params.userId;

  if (!userData) {
    return <AlertNote />;
  }

  const visibility = getProfileVisibilityState(userData, isOwnProfile);

  if (!visibility.canViewPosts) {
    return (
      <p className="text-light-900">This user&apos;s posts are private.</p>
    );
  }

  const token = await getSession();
  const data = await getUserAllPostsAction(params.userId, token, 1, 5);

  if (data?.status === 400) {
    return <AlertNote />;
  }

  return (
    <section className="my-8 flex min-h-80 w-full flex-col gap-4">
      {data.length > 0 ? (
        data
      ) : (
        <div className="flex w-full justify-center pt-8">
          <EmptyDetails
            Icon={CameraIcon}
            text="No Posts Available"
            size="56px"
          />
        </div>
      )}
    </section>
  );
}

export default AllPosts;
