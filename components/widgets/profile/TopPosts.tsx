import { userTopPostInfoAction } from "@/actions/user.action";
import { TopPostsCarousel } from "@/components/widgets/";
import { PostIcon } from "@/public/assets/svgs";
import React from "react";

type Props = {
  params: { userId: string; username: string };
  isOwnProfile: boolean;
};

const TopPosts = async ({ params, isOwnProfile }: Props) => {
  const data = await userTopPostInfoAction(params.userId, false);
  if (data?.status === 400) return null;

  return (
    <React.Fragment>
      {data.response.length > 0 && (
        <div className="flex max-w-[95%] flex-col gap-3">
          <div className="profile-detail-heading w-1/2">
            <PostIcon width="21px" height="21px" /> Top Posts
          </div>
          <TopPostsCarousel slides={data.response} length={data.response.length} />
        </div>
      )}

      {isOwnProfile && data.response.length === 0 ? (
        <div className="flex w-full flex-col gap-3">
          <div className="profile-detail-heading w-1/2">
            <PostIcon width="21px" height="21px" /> Top Posts
          </div>

          <p className="text-center">No posts yet</p>
        </div>
      ) : null}
    </React.Fragment>
  );
};

export default TopPosts;
