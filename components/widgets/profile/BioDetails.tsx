import { QuillIcon } from "@/public/assets/svgs";
import { TCurrentUserData, TPublicUserData } from "@/types/profile.types";
import { FiUser } from "react-icons/fi";

const BioDetails = ({
  userData,
}: {
  userData: TCurrentUserData | TPublicUserData;
}) => {
  return (
    <section className="flex flex-col gap-2">
      <div className="profile-detail-heading mb-3">
        <QuillIcon width="18px" height="18px" />
        Bio Details
      </div>

      <div className="bio-element-wrap">
        <span className="bio-details-icon">
          <FiUser className="text-2xl" />
        </span>
        <p>
          {userData?.personalInfo?.firstName} {userData?.personalInfo?.lastName}
        </p>
      </div>

      <div className="bio-element-wrap items-start">
        <span className="bio-details-icon">
          <FiUser className="text-2xl" />
        </span>
        <p className="pt-2">{userData?.location}</p>
      </div>

      <div className="bio-element-wrap">
        <span className="bio-details-icon">
          <FiUser className="text-2xl" />
        </span>
        <p>{userData?.personalInfo?.language}</p>
      </div>

      <div className="bio-element-wrap">
        <span className="bio-details-icon">
          <FiUser className="text-2xl" />
        </span>
        <p>{userData?.morePersonalInfo?.ethnic}</p>
      </div>
    </section>
  );
};

export default BioDetails;
