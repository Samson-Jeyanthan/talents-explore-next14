import Link from "next/link";
import { MotionDiv } from "../others/MotionDiv";
import UserProfileImg from "../others/UserProfileImg";
import { StarIcon } from "@/public/assets/svgs";
import type { RatingUser } from "@/lib/utils/ratings";

export type IRatingListProp = RatingUser;

interface Prop {
  ratingCard: IRatingListProp;
  index: number;
}

const variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
};

function RatingCard({ ratingCard, index }: Prop) {
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
      className="flex w-full min-w-0 items-center justify-between gap-2 rounded-xl border border-dark-400/50 p-3"
    >
      <div className="flex min-w-0 items-center gap-2">
        <Link
          href={`/profile/${encodeURIComponent(ratingCard.userName)}/${ratingCard._id}`}
          className="shrink-0"
        >
          <UserProfileImg
            src={ratingCard.profileImage}
            userName={ratingCard.firstName}
          />
        </Link>
        <Link
          href={`/profile/${encodeURIComponent(ratingCard.userName)}/${ratingCard._id}`}
          className="min-w-0"
        >
          <p className="break-words text-sm capitalize text-light-900">
            {ratingCard.firstName} {ratingCard.lastName}
          </p>
          <p className="break-words text-xs text-light-600">
            {ratingCard.professional}
          </p>
        </Link>
      </div>
      <div
        className="flex-center w-12 shrink-0 gap-1.5 rounded bg-custom-100/10 fill-custom-100 py-[5px]"
        aria-label={`${ratingCard.rating} out of 5 stars`}
      >
        <StarIcon width="13px" height="13px" />
        <p className="text-sm text-custom-100">{ratingCard.rating}</p>
      </div>
    </MotionDiv>
  );
}

export default RatingCard;
