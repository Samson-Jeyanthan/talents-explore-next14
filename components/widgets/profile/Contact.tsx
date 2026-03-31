import React from "react";
import { EmptyDetails } from "@/components/others";
import {
  EnvelopeIcon,
  PhoneBookIcon,
  PhoneIcon,
  SocialMediaIcon,
} from "@/public/assets/svgs";
import { TCurrentUserData, TPublicUserData } from "@/types/profile.types";
import { FiUser } from "react-icons/fi";
import { canViewBooleanField, getVisibleSocialLinks } from "@/lib/utils/profilePrivacy";

const Contact = ({
  userData,
  isOwnProfile,
}: {
  userData: TCurrentUserData | TPublicUserData;
  isOwnProfile: boolean;
}) => {
  const showEmail = canViewBooleanField(userData, "email", isOwnProfile);
  const showPhone = canViewBooleanField(userData, "phone", isOwnProfile);
  const visibleSocialLinks = getVisibleSocialLinks(userData, isOwnProfile).filter(
    (mediaLink: any) => mediaLink?.url
  );

  return (
    <section className="flex flex-col gap-2">
      <div className="profile-detail-heading mb-3">
        <PhoneBookIcon width="20px" height="20px" />
        Contact & Social Media
      </div>

      <h3 className="text-[13px]">Contact</h3>

      {showEmail && userData?.email ? (
        <div className="flex flex-col gap-2">
          <div className="bio-element-wrap">
            <span className="bio-details-icon">
              <EnvelopeIcon width="16px" height="16px" />
            </span>
            <p>{userData?.email}</p>
          </div>
        </div>
      ) : null}

      {showPhone && userData?.mobile ? (
        <div className="bio-element-wrap">
          <span className="bio-details-icon">
            <PhoneIcon width="16px" height="16px" />
          </span>
          <p>
            {userData?.callingCode} {userData?.mobile}
          </p>
        </div>
      ) : null}

      <h3 className="mt-4 text-[13px]">Social Media</h3>

      {visibleSocialLinks.length > 0 ? null : (
        <EmptyDetails
          Icon={SocialMediaIcon}
          text="There are no social media links"
          size="64px"
        />
      )}

      {visibleSocialLinks.map((mediaLink: any, index: number) => (
        <React.Fragment key={index}>
          <div className="bio-element-wrap items-start">
            <span className="bio-details-icon">
              <FiUser />
            </span>
            <p className="line-clamp-2 w-full max-w-[70%] pt-2 text-left">
              {mediaLink.url}
            </p>
          </div>
        </React.Fragment>
      ))}
    </section>
  );
};

export default Contact;
