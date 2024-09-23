import { ITopPost } from "@/types/profile.types";
import { MotionDiv } from "../others/MotionDiv";
import Link from "next/link";

interface Prop {
  userTopPostCard: ITopPost;
  index: number;
}

const variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
};

const TopPostCard = ({ userTopPostCard, index }: Prop) => {
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
        className="flex w-full flex-col gap-2 rounded-[28px] border-2 border-dark-300 bg-dark-250 p-2 pb-4"
      >
        <div>
          <p>{userTopPostCard.about.title}</p>
          <p>{userTopPostCard.postRating}</p>
          <p>{userTopPostCard.numberOfRating}</p>
        </div>
        <p>{userTopPostCard.media[0].url}</p>
        <p>{userTopPostCard.media[0].thumbnailUrl}</p>
      </MotionDiv>
    </Link>
  );
};

export default TopPostCard;
