import { getFormattedDate } from "@/lib/utils";
import {
  QuillIcon,
  LanguageIcon,
  LocationIcon,
  EthnicIcon,
  CalendarIcon,
} from "@/public/assets/svgs";
import { TCurrentUserData, TPublicUserData } from "@/types/profile.types";
import { FiUser } from "react-icons/fi";

type Props = {
  userData: TCurrentUserData | TPublicUserData;
  isOwnProfile: boolean;
};

const BioDetails = ({ userData, isOwnProfile }: Props) => {
  return (
    <section className="flex flex-col gap-2">
      <div className="profile-detail-heading mb-3">
        <QuillIcon width="18px" height="18px" />
        Bio Details
      </div>

      <div className="bio-element-wrap">
        <span className="bio-details-icon">
          <FiUser />
        </span>
        <p>
          {userData?.personalInfo?.firstName} {userData?.personalInfo?.lastName}
        </p>
      </div>

      <div className="bio-element-wrap items-start">
        <span className="bio-details-icon">
          <LocationIcon width="16px" height="16px" />
        </span>
        <p className="line-clamp-3 pt-2">{userData?.location}</p>
      </div>

      <div className="bio-element-wrap">
        <span className="bio-details-icon">
          <CalendarIcon width="16px" height="16px" />
        </span>
        <p>DOB - {getFormattedDate(userData?.personalInfo?.dob)}</p>
      </div>

      <div className="bio-element-wrap">
        <span className="bio-details-icon">
          <LanguageIcon width="16px" height="16px" />
        </span>
        <p>{userData?.personalInfo?.language}</p>
      </div>

      {isOwnProfile && (
        <div className="bio-element-wrap">
          <span className="bio-details-icon">
            <EthnicIcon width="17px" height="17px" />
          </span>
          <p>{userData?.morePersonalInfo?.ethnic}</p>
        </div>
      )}
    </section>
  );
};

export default BioDetails;
