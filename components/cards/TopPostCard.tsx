import { ITopPost } from "@/types/profile.types";
import { MotionDiv } from "../others/MotionDiv";
import Link from "next/link";
import Image from "next/image";
import { StarIcon } from "@/public/assets/svgs";

interface Prop {
  userTopPostCard: ITopPost;
  index: number;
}

const variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
};

const TopPostCard = ({ userTopPostCard, index }: Prop) => {
  const postRatingValue = Math.floor(userTopPostCard.postRating * 10) / 10;
  return (
    <Link
      href={`/post/${userTopPostCard._id}`}
      className="h-52 w-80 min-w-80 rounded-2xl border-2 border-dark-300 bg-dark-250 p-1"
    >
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
        className="relative flex size-full flex-col gap-2"
      >
        <Image
          src={
            userTopPostCard?.media[0]?.mediaType === "image"
              ? userTopPostCard?.media[0]?.url
              : "/assets/images/sample-post-img.jpg"
          }
          alt={userTopPostCard.about.title}
          width={1024}
          height={512}
          className="size-full rounded-xl bg-dark-400 object-cover"
        />

        <div className="absolute bottom-0 right-0 flex h-1/2 w-full items-end rounded-xl bg-gradient-to-b from-[rgb(17,19,27,0.0)] to-[rgba(17,19,27)] p-2">
          <div className="flex-start w-full gap-2">
            <div className="flex-center gap-2 rounded-full bg-dark-200 fill-custom-100 p-3 py-2 text-sm text-light-900">
              <StarIcon width="16px" height="16px" />
              {Math.floor(postRatingValue) === 0
                ? "N/A"
                : postRatingValue.toFixed(1)}
            </div>
            <p className="line-clamp-1 text-sm text-light-800">
              {userTopPostCard.about.title}
            </p>
          </div>
        </div>
      </MotionDiv>
    </Link>
  );
};

export default TopPostCard;
