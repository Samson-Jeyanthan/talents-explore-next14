import { ITopPost } from "@/types/profile.types";
import { MotionDiv } from "../others/MotionDiv";
import Link from "next/link";
import Image from "next/image";
import { StarIcon } from "@/public/assets/svgs";
import { profilePostThumbnail } from "@/lib/utils/profile-feed";

interface Prop {
  userTopPostCard: ITopPost;
  index: number;
}

const variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
};

const TopPostCard = ({ userTopPostCard, index }: Prop) => {
  const thumbnail = profilePostThumbnail(userTopPostCard);
  const postRatingValue = Math.floor(userTopPostCard.postRating * 10) / 10;
  return (
    <Link
      href={`/post/${userTopPostCard._id}`}
      className="h-52 w-80 min-w-0 max-w-full rounded-2xl border-2 border-dark-300 bg-dark-250 p-1 sm:min-w-80"
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
          src={thumbnail}
          unoptimized={
            thumbnail.startsWith("http") &&
            !thumbnail.startsWith(
              "https://te-files-media.s3.eu-west-2.amazonaws.com/",
            )
          }
          alt={userTopPostCard.about.title}
          width={1024}
          height={512}
          className="size-full rounded-xl bg-dark-400 object-cover"
        />

        <div className="theme-on-media absolute bottom-0 right-0 flex h-1/2 w-full items-end rounded-xl bg-gradient-to-b from-transparent to-black/90 p-2">
          <div className="flex-start w-full gap-2">
            <div className="flex-center gap-2 rounded-full bg-black/70 fill-custom-100 p-3 py-2 text-sm text-white">
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
