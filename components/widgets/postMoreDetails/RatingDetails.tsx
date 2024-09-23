import { HorzBar, RadialBar } from "@/components/others";
import { TPostProps } from "@/types/post.types";
import React from "react";

type Props = {
  postData: TPostProps;
};

const RatingDetails = ({ postData }: Props) => {
  const ratingCounts = [
    {
      no: 5,
      value: postData?.rating?.fiveStar,
      percentage: (postData?.rating?.fiveStar / postData?.numberOfRating) * 100,
    },
    {
      no: 4,
      value: postData?.rating?.fourStar,
      percentage: (postData?.rating?.fourStar / postData?.numberOfRating) * 100,
    },
    {
      no: 3,
      value: postData?.rating?.threeStar,
      percentage:
        (postData?.rating?.threeStar / postData?.numberOfRating) * 100,
    },
    {
      no: 2,
      value: postData?.rating?.twoStar,
      percentage: (postData?.rating?.twoStar / postData?.numberOfRating) * 100,
    },
    {
      no: 1,
      value: postData?.rating?.oneStar,
      percentage: (postData?.rating?.oneStar / postData?.numberOfRating) * 100,
    },
  ];
  return (
    <div className="flex flex-col gap-2">
      <h2 className="text-sm font-medium text-light-900">Ratings</h2>
      <div className="flex items-center justify-start gap-4">
        <HorzBar ratingCounts={ratingCounts} />
        <RadialBar
          avgRating={
            postData.postRating === null
              ? 0
              : Number((Math.round(postData.postRating * 10) / 10).toFixed(1))
          }
          peopleCount={postData.numberOfRating || 0}
        />
      </div>
    </div>
  );
};

export default RatingDetails;
