import Link from "next/link";
import { MotionDiv } from "../others/MotionDiv";
import UserProfileImg from "../others/UserProfileImg";
import { StarIcon } from "@/public/assets/svgs";

export interface IRatingListProp {
  _id: string;
  rating: number;
  userName: string;
  firstName: string;
  lastName: string;
  profileImage: string;
  professional: string;
}

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
      className="flex-between w-[95%] gap-2"
    >
      <div className="flex items-center justify-center gap-2">
        <Link href={`/profile/${ratingCard.userName}/${ratingCard._id}`}>
          <UserProfileImg
            src={ratingCard.profileImage}
            userName={ratingCard.firstName}
          />
        </Link>
        <Link
          href={`/profile/${ratingCard.userName}/${ratingCard._id}`}
          className=""
        >
          <p className="text-sm capitalize text-light-900">
            {ratingCard.firstName} {ratingCard.lastName}
          </p>
          <p className="text-xs text-light-600">{ratingCard.professional}</p>
        </Link>
      </div>
      <div className="flex-center w-12 gap-1.5 rounded bg-custom-100/10 fill-custom-100 py-[5px]">
        <StarIcon width="13px" height="13px" />
        <p className="text-sm text-custom-100">{ratingCard.rating}</p>
      </div>
    </MotionDiv>
  );
}

export default RatingCard;
