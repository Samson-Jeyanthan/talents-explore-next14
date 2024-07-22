import Image from "next/image";
import { StarIcon } from "@/public/assets/svgs";

const ProfileCover = () => {
  return (
    <div className="fixed top-0 z-0 mt-14 w-full max-w-screen-xl rounded-2xl">
      <div className="flex-center absolute top-8 gap-3 rounded-r-lg bg-dark-200 fill-custom-100 px-5 py-3 text-light-900">
        <StarIcon width="18px" height="18px" /> 4.7
      </div>
      <div className="absolute top-0 h-[40vh] w-full bg-gradient-to-t from-[rgb(17,19,27,0.75)] to-[rgba(17,19,27,0.0)]" />
      <Image
        src="/assets/images/sample-profile-cover-photo-6.jpg"
        width={1948}
        height={1948}
        alt="cover photo"
        className="h-[40vh] w-full rounded-2xl object-cover 2xl:h-[40vh]"
      />
    </div>
  );
};

export default ProfileCover;
