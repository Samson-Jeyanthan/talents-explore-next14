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

const Contact = ({
  userData,
}: {
  userData: TCurrentUserData | TPublicUserData;
}) => {
  return (
    <section className="flex flex-col gap-2">
      <div className="profile-detail-heading mb-3">
        <PhoneBookIcon width="20px" height="20px" />
        Contact & Social Media
      </div>

      <h3 className="text-[13px]">Contact</h3>

      <div className="flex flex-col gap-2">
        <div className="bio-element-wrap">
          <span className="bio-details-icon">
            <EnvelopeIcon width="16px" height="16px" />
          </span>
          <p>{userData?.email}</p>
        </div>
      </div>

      {/* {userData?.mobile && ( */}
      <div className="bio-element-wrap">
        <span className="bio-details-icon">
          <PhoneIcon width="16px" height="16px" />
        </span>
        <p>
          {userData?.callingCode} {userData?.mobile}
        </p>
      </div>
      {/* )} */}

      <h3 className="mt-4 text-[13px]">Social Media</h3>

      {userData?.morePersonalInfo?.socialLinks?.length > 0 ? null : (
        <EmptyDetails
          Icon={SocialMediaIcon}
          text="There are no social media links"
          size="64px"
        />
      )}

      {userData?.morePersonalInfo?.socialLinks?.map((mediaLink, index) => (
        <React.Fragment key={index}>
          {mediaLink.url !== "" ? (
            <div className="bio-element-wrap items-start">
              <span className="bio-details-icon">
                <FiUser />
              </span>
              <p className="line-clamp-2 w-full max-w-[70%] pt-2 text-left">
                {mediaLink.url}
              </p>
            </div>
          ) : null}
        </React.Fragment>
      ))}
    </section>
  );
};

export default Contact;
