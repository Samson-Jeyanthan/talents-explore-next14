import Image from "next/image";
import { StarIcon } from "@/public/assets/svgs";

type Props = {
  avgRating?: number;
  coverPhoto: string | null;
  isTalent: boolean;
  isLoggedIn: boolean;
};

const ProfileCover = ({
  avgRating,
  coverPhoto,
  isTalent,
  isLoggedIn,
}: Props) => {
  return (
    <div
      className={`${isTalent ? `sticky ${isLoggedIn ? "top-8 2xl:top-8" : "top-16 z-0 xl:top-16 2xl:top-16"}` : ""} w-full rounded-2xl`}
    >
      <p className="text-light-900">{isLoggedIn}</p>
      {isTalent ? (
        <div className="flex-center absolute top-8 gap-3 rounded-r-lg bg-dark-200 fill-custom-100 px-5 py-3 text-light-900">
          <StarIcon width="18px" height="18px" />
          {avgRating ? avgRating.toFixed(1) : "N/A"}
        </div>
      ) : null}

      <Image
        src={coverPhoto || "/assets/images/sample-profile-cover-photo-5.jpg"}
        width={2048}
        height={1024}
        alt="cover photo"
        className={`${isTalent ? "h-52 lg:h-[35vh] 2xl:h-[35vh]" : "h-[30vh]"} w-full rounded-2xl bg-dark-400 object-cover`}
      />
    </div>
  );
};

export default ProfileCover;
