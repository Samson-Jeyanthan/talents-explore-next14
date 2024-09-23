import { IComments } from "@/types/post.types";
import { MotionDiv } from "../others/MotionDiv";
import UserProfileImg from "../others/UserProfileImg";
import Link from "next/link";
import { getFormattedDate } from "@/lib/utils";
import { BsDot } from "react-icons/bs";

interface Prop {
  commentCard: IComments;
  index: number;
}

const variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
};

const CommentsCard = ({ commentCard, index }: Prop) => {
  const profilePath = `/profile/${commentCard.author.userName}/${commentCard.author._id}`;
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
      className="flex items-start gap-2 p-2 pl-0"
    >
      <Link href={profilePath}>
        <UserProfileImg
          src={commentCard.author.profileImage}
          userName={commentCard.author.userName}
          className="size-[40px] min-h-[40px] min-w-[40px] rounded-xl"
        />
      </Link>
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-[2px] text-xs text-light-500">
          <Link href={profilePath}>@{commentCard.author.userName}</Link>
          <BsDot className="text-xs" />
          <p>{getFormattedDate(commentCard.createdAt)}</p>
        </div>
        <p className="text-[13px] text-light-900 first-letter:capitalize">
          {commentCard.comment}
        </p>
      </div>
    </MotionDiv>
  );
};

export default CommentsCard;
