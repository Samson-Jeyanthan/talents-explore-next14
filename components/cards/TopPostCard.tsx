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
    <Link href={`/post/${userTopPostCard._id}`}>
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
        className="relative flex size-full flex-col gap-2 rounded-lg border-2 border-dark-300 bg-dark-250 p-2"
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
          className="h-52 w-[22rem] rounded-2xl bg-dark-400 object-cover"
        />

        <div className="absolute bottom-2 right-2 flex gap-2">
          <div className="flex-center absolute bottom-2 right-2 gap-2 rounded-full bg-dark-200 fill-custom-100 p-3 py-2 text-sm text-light-900">
            <StarIcon width="16px" height="16px" />
            {Math.floor(postRatingValue) === 0
              ? "N/A"
              : postRatingValue.toFixed(1)}
          </div>
          <p>{userTopPostCard.about.title}</p>
          <p>{userTopPostCard.numberOfRating}</p>
        </div>
      </MotionDiv>
    </Link>
  );
};

export default TopPostCard;
