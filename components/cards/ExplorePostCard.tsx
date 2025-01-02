import Link from "next/link";
import UserProfileImg from "../others/UserProfileImg";
import { getFormattedDecimal } from "@/lib/utils";
import { MotionDiv } from "../others/MotionDiv";
import { StarIcon } from "@/public/assets/svgs";
import Image from "next/image";

interface Props {
  postCard: any;
  index: number;
}

const variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
};

const ExplorePostCard = ({ postCard, index }: Props) => {
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
      className="relative z-0 h-72 w-56 break-inside-avoid rounded-[20px] p-0"
    >
      <Link href={`/post/${postCard._id}`}>
        {postCard?.media[0]?.mediaType === "image" ? (
          <Image
            src={postCard.media[0]?.url || ""}
            width={1024}
            height={1024}
            className="size-full rounded-[20px] object-cover"
            alt={postCard?.about?.title}
          />
        ) : (
          <Image
            src={"/assets/images/sample-post-img.jpg"}
            width={1024}
            height={1024}
            className="size-full rounded-[20px] object-cover"
            alt={postCard?.about?.title}
          />
        )}
      </Link>

      <span className="flex-center absolute left-3 top-3 gap-2 rounded-full bg-dark-200 fill-custom-100 p-2 py-1.5 text-xs text-light-900">
        <StarIcon width="13px" height="13px" />
        {getFormattedDecimal(postCard.postRating ? postCard.postRating : 0)}
      </span>

      <div className="absolute bottom-0 z-20 flex h-12 w-full items-center justify-start gap-1 rounded-b-[20px] bg-dark-200/40 px-2 text-xs text-light-700 backdrop-blur-[80px]">
        <Link
          href={`/profile/${postCard.author.userName}/${postCard.author._id}`}
          className="flex items-center justify-start gap-1"
        >
          <UserProfileImg
            src={postCard.author.profileImage}
            userName={postCard.author.userName}
            className="!size-7 !min-h-7 !min-w-7 rounded-full"
          />
          <p>@{postCard.author.userName}</p>
        </Link>
      </div>
    </MotionDiv>
  );
};

export default ExplorePostCard;
