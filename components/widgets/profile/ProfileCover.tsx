import Image from "next/image";
import { StarIcon } from "@/public/assets/svgs";

const ProfileCover = async ({
  avgRating,
  coverPhoto,
  isTalent,
}: {
  avgRating?: number;
  coverPhoto: string | null;
  isTalent: boolean;
}) => {
  await new Promise((resolve) => setTimeout(resolve, 1000));

  return (
    <div
      className={`${isTalent ? "sticky top-14 z-0 2xl:top-16" : ""} w-full rounded-2xl`}
    >
      {isTalent ? (
        <div className="flex-center absolute top-8 gap-3 rounded-r-lg bg-dark-200 fill-custom-100 px-5 py-3 text-light-900">
          <StarIcon width="18px" height="18px" />
          {avgRating ? avgRating.toFixed(1) : "N/A"}
        </div>
      ) : null}

      {/* {isTalent && (
        <div className="absolute top-0 h-[30vh] w-full bg-gradient-to-t from-[rgb(17,19,27,0.75)] to-[rgba(17,19,27,0.0)]" />
      )} */}
      <Image
        src={
          // eslint-disable-next-line no-unneeded-ternary
          coverPhoto
            ? coverPhoto
            : "/assets/images/sample-profile-cover-photo-5.jpg"
        }
        width={2048}
        height={1024}
        alt="cover photo"
        className={`${isTalent ? "h-52 lg:h-[35vh] 2xl:h-[35vh]" : "h-[30vh]"} w-full rounded-2xl bg-dark-400 object-cover`}
      />
    </div>
  );
};

export default ProfileCover;
