import { userTopPostInfoAction } from "@/actions/user.action";
import { TopPostsCarousel } from "@/components/widgets/";
import { CameraIcon } from "@/public/assets/svgs";
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
            <CameraIcon width="21px" height="21px" /> Top Posts
          </div>
          <TopPostsCarousel slides={data.response} />
        </div>
      )}
    </React.Fragment>
  );
};

export default TopPosts;
