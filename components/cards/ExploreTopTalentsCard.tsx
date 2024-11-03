import Link from "next/link";
import UserProfileImg from "../others/UserProfileImg";
import { UserRatingRadialBar } from "../others/RadialBar";
import Image from "next/image";
import { IExploreTalentsProps } from "@/types/utils.types";

const ExploreTopTalentsCard = ({
  _id,
  userName,
  profileImage,
  professional,
  avgRating,
}: IExploreTalentsProps) => {
  return (
    <Link
      href={`/profile/${userName}/${_id}`}
      className="relative z-10 flex w-72 items-center justify-between rounded-2xl border-2 border-dark-300"
    >
      <div className="flex-center z-10 size-full rounded-2xl bg-dark-200/60 p-3 py-2 backdrop-blur-[60px]">
        <div className="flex w-full items-center gap-2">
          <UserProfileImg
            src={profileImage}
            userName={userName}
            className="size-16 min-h-16 min-w-16 rounded-full"
          />

          <div className="flex flex-col gap-1">
            <p className="text-sm lowercase text-light-800">@{userName}</p>
            <p className="text-xs text-light-500">{professional}</p>
          </div>
        </div>

        <UserRatingRadialBar avgRating={avgRating} />
      </div>
      <Image
        src={profileImage || "/assets/images/default_profile_pic_2.png"}
        width={512}
        height={512}
        alt="profile-pic"
        className="absolute left-1 top-4 z-0 h-12 w-56 rounded-xl bg-dark-400 object-cover"
      />
    </Link>
  );
};

export default ExploreTopTalentsCard;
