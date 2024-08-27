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
      className={`${isTalent ? "fixed top-0 z-0 mt-14" : ""} w-full max-w-screen-xl rounded-2xl 2xl:max-w-[1200px]`}
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
        className={`${isTalent ? "h-[40vh] 2xl:h-[30vh]" : "h-[30vh]"} w-full rounded-2xl bg-dark-400 object-cover`}
      />
    </div>
  );
};

export default ProfileCover;
