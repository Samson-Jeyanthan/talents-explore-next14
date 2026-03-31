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
import { canViewBooleanField } from "@/lib/utils/profilePrivacy";

type Props = {
  userData: TCurrentUserData | TPublicUserData;
  isOwnProfile: boolean;
};

const BioDetails = ({ userData, isOwnProfile }: Props) => {
  const showFirstName = canViewBooleanField(userData, "firstName", isOwnProfile);
  const showLastName = canViewBooleanField(userData, "lastName", isOwnProfile);
  const showLocation = canViewBooleanField(userData, "location", isOwnProfile);
  const showDob = canViewBooleanField(userData, "dob", isOwnProfile);
  const showLanguage = canViewBooleanField(userData, "language", isOwnProfile);
  const fullName = [
    showFirstName ? userData?.personalInfo?.firstName : "",
    showLastName ? userData?.personalInfo?.lastName : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <section className="flex flex-col gap-2">
      <div className="profile-detail-heading mb-3">
        <QuillIcon width="18px" height="18px" />
        Bio Details
      </div>

      {fullName ? (
        <div className="bio-element-wrap">
          <span className="bio-details-icon">
            <FiUser />
          </span>
          <p>{fullName}</p>
        </div>
      ) : null}

      {showLocation && userData?.location ? (
        <div className="bio-element-wrap items-start">
          <span className="bio-details-icon">
            <LocationIcon width="16px" height="16px" />
          </span>
          <p className="line-clamp-3 pt-2">{userData?.location}</p>
        </div>
      ) : null}

      {showDob && userData?.personalInfo?.dob ? (
        <div className="bio-element-wrap">
          <span className="bio-details-icon">
            <CalendarIcon width="16px" height="16px" />
          </span>
          <p>DOB - {getFormattedDate(userData?.personalInfo?.dob)}</p>
        </div>
      ) : null}

      {showLanguage && userData?.personalInfo?.language ? (
        <div className="bio-element-wrap">
          <span className="bio-details-icon">
            <LanguageIcon width="16px" height="16px" />
          </span>
          <p>{userData?.personalInfo?.language}</p>
        </div>
      ) : null}

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
