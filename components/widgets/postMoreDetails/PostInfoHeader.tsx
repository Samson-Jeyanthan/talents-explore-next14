import { PostUtilsButton } from "@/components/buttons";
import { StarRating } from "@/components/inputs";
import { SaveCollectionModal } from "@/components/modals";
import { PostOptions } from "@/components/options";
import UserProfileImg from "@/components/others/UserProfileImg";
import { getFormattedDate, getFormattedDecimal } from "@/lib/utils";
import { StarIcon } from "@/public/assets/svgs";
import { TPostProps } from "@/types/post.types";
import Link from "next/link";
import React from "react";
import { FaLocationDot } from "react-icons/fa6";
import { IoCalendar } from "react-icons/io5";

type Props = {
  postData: TPostProps;
};

const PostInfoHeader = ({ postData }: Props) => {
  const author = postData?.author || {};
  const profileLink = author?._id
    ? `/profile/${author?.userName}/${author?._id}`
    : "#";
  const about = postData?.about || {};
  const locationLabel = [about?.country, about?.state].filter(Boolean).join(" - ");

  return (
    <section className="flex flex-col text-light-900">
      <div className="flex-between gap-2 border-b-2 border-solid border-dark-300 pb-6 pt-1">
        <h1 className="text-left text-3xl font-semibold capitalize">
          {about?.title || "Untitled post"}
        </h1>
        <div className="flex gap-3">
          <SaveCollectionModal postId={postData._id} />
          <PostUtilsButton buttonFor="SHARE" className="p-3" />
          {author?._id ? (
            <PostOptions
              authorId={author._id}
              postId={postData._id}
              isBestWork={postData.isBestWork}
              className="flex-center !size-[42px] space-x-1 !px-2"
            />
          ) : null}
        </div>
      </div>

      <div className="flex items-start justify-between pt-6">
        <div className="flex flex-col gap-3">
          <div className="flex items-start gap-3">
            {author?._id ? (
              <Link href={profileLink}>
                <UserProfileImg
                  src={author?.profileImage}
                  userName={author?.userName}
                  className="size-20 rounded-2xl"
                />
              </Link>
            ) : (
              <UserProfileImg
                src={author?.profileImage}
                userName={author?.userName || "Unknown user"}
                className="size-20 rounded-2xl"
              />
            )}
            <div className="flex flex-col gap-1">
              {author?._id ? (
                <>
                  <Link href={profileLink} className="text-xl font-medium">
                    {author?.firstName} {author?.lastName}
                  </Link>
                  <Link href={profileLink} className="text-sm">
                    @{author?.userName}
                  </Link>
                </>
              ) : (
                <>
                  <p className="text-xl font-medium">Unknown user</p>
                  <p className="text-sm text-light-500">Profile unavailable</p>
                </>
              )}
            </div>
          </div>

          <div className="flex gap-2 text-xs text-light-500">
            {locationLabel ? (
              <p className="flex items-center gap-1">
                <FaLocationDot />
                {locationLabel}
              </p>
            ) : null}
            <p className="flex items-center gap-1">
              <IoCalendar />
              {getFormattedDate(postData?.publishedAt)}
            </p>
          </div>

          <div className="flex gap-2">
            {about?.mainCategory ? (
              <span className="all-post-card-tags">{about.mainCategory}</span>
            ) : null}
            {about?.subCategory ? (
              <span className="all-post-card-tags">{about.subCategory}</span>
            ) : null}
            {about?.skill ? (
              <span className="all-post-card-tags">{about.skill}</span>
            ) : null}
            <span className="all-post-card-tags flex items-center gap-2 fill-custom-100">
              <StarIcon width="14px" height="14px" />
              {getFormattedDecimal(postData?.postRating)}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3 text-sm text-light-500">
          <p>Rate this post</p>
          <StarRating
            prevRatingValue={postData?.yourRating}
            ratingFor="POST"
            postId={postData?._id}
            authorId={author?._id}
            revalidatePath={`/post/${postData?._id}`}
          />
        </div>
      </div>
    </section>
  );
};

export default PostInfoHeader;
