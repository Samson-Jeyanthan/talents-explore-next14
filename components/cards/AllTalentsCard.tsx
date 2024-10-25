import Link from "next/link";
import UserProfileImg from "../others/UserProfileImg";
import Image from "next/image";
import { IExploreTalentsProps } from "@/types/utils.types";
import { getFormattedDecimal } from "@/lib/utils";
import { StarIcon } from "@/public/assets/svgs";

interface Props {
  allTalentsCard: IExploreTalentsProps;
  index: number;
}

const AllTalentsCard = ({ allTalentsCard, index }: Props) => {
  return (
    <Link
      href={`/profile/${allTalentsCard.userName}/${allTalentsCard._id}`}
      className="relative z-10 flex min-w-40 items-center justify-between rounded-2xl border-2 border-dark-300 2xl:max-w-48"
    >
      <div className="flex-center z-10 size-full flex-col gap-2 rounded-2xl bg-dark-200/60 p-3 py-7 backdrop-blur-[60px]">
        <UserProfileImg
          src={allTalentsCard.profileImage}
          userName={allTalentsCard.userName}
          className="size-16 min-h-16 min-w-16 rounded-full"
        />
        <p className="text-sm lowercase text-light-800">
          @{allTalentsCard.userName}
        </p>
        <p className="text-xs text-light-500">{allTalentsCard.professional}</p>
        <p className="flex-center gap-2 fill-custom-100 text-xs text-light-900">
          <StarIcon width="16px" height="16px" />
          {getFormattedDecimal(allTalentsCard.avgRating)}
          <span className="text-xs text-light-500">
            {allTalentsCard.numberOfRating === null
              ? "0"
              : allTalentsCard.numberOfRating}{" "}
            Ratings
          </span>
        </p>
      </div>
      <Image
        src={
          allTalentsCard.profileImage ||
          "/assets/images/default_profile_pic_2.png"
        }
        width={512}
        height={512}
        alt="profile-pic"
        className="absolute left-0 top-4 z-0 h-12 w-56 rounded-xl bg-dark-400 object-cover"
      />
    </Link>
  );
};

export default AllTalentsCard;
