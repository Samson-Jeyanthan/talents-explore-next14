import { ISavedItem } from "@/types/post.types";
import { MotionDiv } from "../others/MotionDiv";
import Image from "next/image";
import UserProfileImg from "../others/UserProfileImg";
import Link from "next/link";
import { getFormattedDecimal } from "@/lib/utils";
import { StarIcon } from "@/public/assets/svgs";

interface Props {
  itemCard: ISavedItem;
  index: number;
}

const variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
};

const SavedItemCard = ({ itemCard, index }: Props) => {
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
      className="relative z-0 mb-5 max-h-[600px] min-h-[180px] max-w-full break-inside-avoid rounded-[20px] p-0 sm:max-h-[550px] sm:max-w-[300px]"
    >
      <Link href={`/post/${itemCard._id}`}>
        {itemCard.media[0].mediaType === "image" ? (
          <Image
            src={itemCard.media[0]?.url || ""}
            width={1024}
            height={1024}
            className="h-auto max-h-[600px] min-h-[180px] w-full rounded-[20px] object-cover sm:max-h-[550px]"
            alt={itemCard.about.title}
          />
        ) : (
          <Image
            src={"/assets/images/sample-post-img.jpg"}
            width={1024}
            height={1024}
            className="h-auto max-h-[600px] min-h-[180px] w-full rounded-[20px] object-cover sm:max-h-[550px]"
            alt={itemCard.about.title}
          />
        )}
      </Link>

      <div className="flex-between absolute bottom-0 z-20 h-12 w-full gap-2 rounded-b-[20px] bg-dark-200/40 px-2 text-xs text-light-700 backdrop-blur-[80px]">
        <div className="flex items-center gap-2">
          <UserProfileImg
            src={itemCard.author.profileImage}
            userName={itemCard.author.userName}
            className="size-8 rounded-full"
          />
          <p>@{itemCard.author.userName}</p>
        </div>
        <span className="flex w-max items-center gap-1 rounded-xl bg-none fill-custom-100 px-2 text-xs text-light-700">
          <StarIcon width="13px" height="13px" />
          {getFormattedDecimal(itemCard.postRating)}
        </span>
      </div>
      {/* {itemCard.media[0]?.thumbnailUrl}
      {itemCard.media.length}
      {itemCard.postRating} */}
    </MotionDiv>
  );
};

export default SavedItemCard;
