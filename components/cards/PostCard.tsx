import { IPost } from "@/types/post.types";
import { MotionDiv } from "../others/MotionDiv";
import UserProfileImg from "../others/UserProfileImg";
import Link from "next/link";
import { StarIcon } from "@/public/assets/svgs";
import { getFormattedDecimal } from "@/lib/utils";
import { PostOptions } from "../options";
import { PostUtilsButton } from "../buttons";
import { PostFeedCarousel } from "../widgets";
import { StarRating } from "../inputs";
import { SaveCollectionModal } from "../modals";
import { getProfileVisibilityState } from "@/lib/utils/profilePrivacy";

interface Props {
  postFeedCard: IPost;
  index: number;
}

const variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
};

const PostCard = ({ postFeedCard, index }: Props) => {
  const postLink = `/post/${postFeedCard._id}`;
  const userProfile = `/profile/${postFeedCard.author.userName}/${postFeedCard.author._id}`;
  const visibility = getProfileVisibilityState(postFeedCard.author, false);
  return (
    <MotionDiv
      variants={variants}
      initial="hidden"
      animate="visible"
      transition={{
        delay: index * 0.15,
        ease: "easeInOut",
        duration: 0.3,
      }}
      viewport={{ amount: 0 }}
      className="relative flex flex-col gap-3 rounded-[28px] border-2 border-dark-300 bg-dark-250 p-3 text-light-900"
    >
      <div className="flex w-full items-start justify-between">
        <div className="flex items-start gap-2">
          <Link href={userProfile}>
            <UserProfileImg
              src={postFeedCard.author.profileImage}
              userName={postFeedCard.author.userName}
              className="rounded-full"
            />
          </Link>

          <div className="flex flex-col gap-1 ">
            <Link
              href={userProfile}
              className="w-max text-sm lowercase text-light-800"
            >
              @{postFeedCard.author.userName}
            </Link>
            <p className="flex gap-1 text-xs text-light-500">
              {postFeedCard.timeAgo} - {postFeedCard.about.country}
            </p>
          </div>
        </div>

        <div className="flex gap-1">
          <div className="flex-center w-max gap-1.5 rounded bg-custom-100/10 fill-custom-100 px-2 py-[5px]">
            <StarIcon width="13px" height="13px" />
            <p className="text-sm text-custom-100">
              {getFormattedDecimal(postFeedCard.postRating)}
            </p>
          </div>

          <PostOptions
            authorId={postFeedCard.author._id}
            isBestWork={postFeedCard.isBestWork}
            postId={postFeedCard._id}
            className="!h-8 border-none !bg-dark-250 p-1"
          />
        </div>
      </div>

      <Link
        href={postLink}
        className="my-1 w-max text-lg font-medium first-letter:capitalize"
      >
        {postFeedCard.about.title}
      </Link>

      <PostFeedCarousel
        slides={postFeedCard.media}
        length={postFeedCard.media.length}
      />

      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          <PostUtilsButton buttonFor="COMMENT" size="19px" />
          <PostUtilsButton buttonFor="SHARE" size="19px" />
          <SaveCollectionModal
            postId={postFeedCard._id}
            buttonClassName="!bg-transparent p-0"
          />
        </div>

        {visibility.canRatePosts ? (
          <StarRating
            postId={postFeedCard._id}
            prevRatingValue={postFeedCard.yourRating}
            ratingFor="POST"
            authorId={postFeedCard.author._id}
            revalidatePath={"/home"}
          />
        ) : (
          <p className="text-xs text-light-500">Ratings private</p>
        )}
      </div>

      <p className="text-xs text-light-500">
        {postFeedCard.totalComments} comments and {postFeedCard.numberOfRating}{" "}
        ratings
      </p>

      <div className="flex gap-2">
        <p className="all-post-card-tags">{postFeedCard.about.mainCategory}</p>
        <p className="all-post-card-tags">{postFeedCard.about.skill}</p>
      </div>

      <p className="line-clamp-3 text-justify text-[13px] text-light-700">
        {postFeedCard.about.description}
      </p>
    </MotionDiv>
  );
};

export default PostCard;
