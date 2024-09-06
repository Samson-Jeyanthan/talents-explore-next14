import { PostUtilsButton } from "@/components/buttons";
import { StarRating } from "@/components/inputs";
import { PostOptions } from "@/components/options";
import UserProfileImg from "@/components/others/UserProfileImg";
import { getFormattedDate, getFormattedDecimal } from "@/lib/utils";
import { StarIcon } from "@/public/assets/svgs";
import { TPostProps } from "@/types/post.types";
import Link from "next/link";
import { FaLocationDot } from "react-icons/fa6";
import { IoCalendar } from "react-icons/io5";

type Props = {
  postData: TPostProps;
};

const PostInfoHeader = ({ postData }: Props) => {
  const profileLink = `/profile/${postData.author.userName}/${postData.author._id}`;
  return (
    <section className="flex flex-col text-light-900">
      <div className="flex-between gap-2 border-b-2 border-solid border-dark-300 pb-6 pt-1">
        <h1 className="text-left text-3xl font-semibold capitalize">
          {postData.about.title}
        </h1>
        <div className="flex gap-3">
          <PostUtilsButton buttonFor="SAVE" className="px-3 py-2" />
          <PostUtilsButton buttonFor="SHARE" className="p-3" />
          <PostOptions
            authorId={postData.author._id}
            postId={postData._id}
            isBestWork={postData.isBestWork}
          />
        </div>
      </div>

      <div className="flex items-start justify-between pt-6">
        <div className="flex flex-col gap-3">
          <div className="flex items-start gap-3">
            <Link href={profileLink}>
              <UserProfileImg
                src={postData.author.profileImage}
                userName={postData.author.userName}
                className="size-20 rounded-2xl"
              />
            </Link>
            <div className="flex flex-col gap-1">
              <Link href={profileLink} className="text-xl font-medium">
                {postData.author.firstName} {postData.author.lastName}
              </Link>
              <Link href={profileLink} className="text-sm">
                @{postData.author.userName}
              </Link>
            </div>
          </div>

          <div className="flex gap-2 text-xs text-light-500">
            <p className="flex items-center gap-1">
              <FaLocationDot />
              {postData.about.country} - {postData.about.state}
            </p>
            <p className="flex items-center gap-1">
              <IoCalendar />
              {getFormattedDate(postData.publishedAt)}
            </p>
          </div>

          <div className="flex gap-2">
            <span className="all-post-card-tags">
              {postData.about.mainCategory}
            </span>
            <span className="all-post-card-tags">
              {postData.about.subCategory}
            </span>
            <span className="all-post-card-tags">{postData.about.skill}</span>
            <span className="all-post-card-tags flex items-center gap-2 fill-custom-100">
              <StarIcon width="14px" height="14px" />
              {getFormattedDecimal(postData.postRating)}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3 text-sm text-light-500">
          <p>Rate this post</p>
          <StarRating prevRatingValue={postData.yourRating} ratingFor="POST" />
        </div>
      </div>
    </section>
  );
};

export default PostInfoHeader;
