import { QuillIcon } from "@/public/assets/svgs";
import { TCurrentUserData, TPublicUserData } from "@/types/profile.types";
import React from "react";
import { FiUser } from "react-icons/fi";

const Contact = ({
  userData,
}: {
  userData: TCurrentUserData | TPublicUserData;
}) => {
  return (
    <section className="flex flex-col gap-2">
      <div className="profile-detail-heading mb-3">
        <QuillIcon width="18px" height="18px" />
        Contact & Social Media
      </div>

      {/* <div className="flex flex-col gap-1"> */}
      <h3 className="text-sm">Contact</h3>

      <div className="flex flex-col gap-2">
        <div className="bio-element-wrap">
          <span className="bio-details-icon">
            <FiUser />
          </span>
          <p>{userData?.email}</p>
        </div>
      </div>
      {/* </div> */}

      <div className="bio-element-wrap">
        <span className="bio-details-icon">
          <FiUser />
        </span>
        <p>
          {userData?.callingCode} {userData?.mobile}
        </p>
      </div>

      <h3 className="mt-3 text-sm">Social Media</h3>

      {userData?.morePersonalInfo?.socialLinks?.length > 0 ? null : (
        <p>No social media links</p>
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
