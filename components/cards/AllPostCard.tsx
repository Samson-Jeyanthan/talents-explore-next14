import { IPost } from "@/types/post.types";
import { MotionDiv } from "../others/MotionDiv";
import Image from "next/image";
import Link from "next/link";
import { MultiPostIcon, PinIcon, StarIcon } from "@/public/assets/svgs";
import { GoDotFill } from "react-icons/go";
import { FaLocationDot } from "react-icons/fa6";
import { PostOptions } from "../options";

interface Prop {
  allPostCard: IPost;
  index: number;
}

const variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
};

function AllPostCard({ allPostCard, index }: Prop) {
  const postRatingValue = Math.floor(allPostCard.postRating * 10) / 10;
  const postLink = `/post/${allPostCard._id}`;

  // eslint-disable-next-line prefer-const
  let isPinned = allPostCard.isBestWork;

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
      className="relative flex gap-3 rounded-[28px] border-2 border-dark-300 bg-dark-250 p-2"
    >
      <Link href={postLink} className="relative h-52 w-80 rounded-lg">
        <span className="absolute left-3 top-3 flex gap-2 fill-white">
          {isPinned && <PinIcon height="18px" width="18px" />}

          {allPostCard.media.length > 1 && (
            <MultiPostIcon height="18px" width="18px" />
          )}
        </span>

        <Image
          src={
            allPostCard.media[0].mediaType === "image"
              ? allPostCard.media[0].url
              : "/assets/images/sample-post-img.jpg"
          }
          alt={allPostCard.about.title}
          width={1024}
          height={512}
          className="size-full min-w-80 rounded-2xl bg-dark-400 object-cover"
        />

        <div className="flex-center absolute bottom-2 right-2 gap-2 rounded-full bg-dark-200 fill-custom-100 p-3 py-2 text-sm text-light-900">
          <StarIcon width="16px" height="16px" />
          {Math.floor(postRatingValue) === 0
            ? "N/A"
            : postRatingValue.toFixed(1)}
        </div>
      </Link>

      <div className="flex w-3/5 flex-col gap-2 2xl:w-4/6 2xl:gap-1">
        <Link
          href={postLink}
          className="w-max cursor-pointer text-xl font-semibold capitalize text-light-900"
        >
          {allPostCard.about.title}
        </Link>
        <p className="flex items-center gap-1 text-xs text-light-500">
          <FaLocationDot />
          {allPostCard.about.country} - {allPostCard.about.state}
          <GoDotFill className="text-[8px]" />
          {allPostCard.timeAgo}
        </p>
        <p className="line-clamp-3 text-ellipsis text-justify text-xs text-light-500 first-letter:capitalize 2xl:text-sm">
          {allPostCard.about.description}
        </p>
        <div className="absolute bottom-3 right-3 flex gap-2">
          <p className="all-post-card-tags">
            {allPostCard.numberOfRating} Ratings
          </p>
          <p className="all-post-card-tags">{allPostCard.about.mainCategory}</p>
          <p className="all-post-card-tags">{allPostCard.about.skill}</p>
        </div>
      </div>

      <div className="absolute right-2 top-2">
        <PostOptions
          authorId={allPostCard.author._id}
          postId={allPostCard._id}
          isBestWork={isPinned}
          className="flex-center !size-10 space-x-1 !px-2"
        />
      </div>
    </MotionDiv>
  );
}

export default AllPostCard;
