"use client";

import Image from "next/image";
import { GoDotFill } from "react-icons/go";
import { Button } from "../ui/button";
import { ProfileOptions } from "../options";
import { useState } from "react";
import { PhotoViewModal } from "../modals";
import { Dialog } from "../ui/dialog";
import ConnectionListModal from "../modals/ConnectionListModal";
import { MessageIcon } from "@/public/assets/svgs";

const ProfileHeader = ({
  userData,
  isOwnProfile,
}: {
  userData: any;
  isOwnProfile: boolean;
}) => {
  const [showDP, setShowDP] = useState(false);
  const [showConnection, setShowConnection] = useState(false);
  const [currentTab, setCurrentTab] = useState(0);

  const handleShowDP = () => {
    if (userData?.personalInfo?.profileImage) setShowDP(!showDP);
  };

  const handleConnectionModalOpen = async (currentTab: number) => {
    setShowConnection(!showConnection);
    setCurrentTab(currentTab);
  };

  return (
    <header className="-mt-1 flex w-full flex-col bg-gradient-to-b from-[rgb(17,19,27,0.45)] to-[rgba(17,19,27)] backdrop-blur-lg 2xl:-mt-10">
      <section className="flex items-start justify-between p-3 py-2 2xl:p-3">
        <div className="flex-start gap-5">
          <Image
            src={`${userData?.personalInfo?.profileImage ? userData?.personalInfo?.profileImage : "/assets/images/default_profile_pic_2.png"}`}
            width={1024}
            height={1024}
            alt="profile photo"
            className="size-24 cursor-pointer rounded-full bg-dark-400 object-cover"
            onClick={handleShowDP}
          />
          <div className="flex flex-col gap-1">
            <h1 className="text-5xl font-semibold capitalize text-light-900">
              {userData?.personalInfo?.firstName}{" "}
              {userData?.personalInfo?.lastName}
            </h1>
            <p className="flex-start gap-1 text-sm text-light-900">
              @{userData?.userName} <GoDotFill className="text-[8px]" />{" "}
              {userData?.personalInfo?.professional}
            </p>
          </div>
        </div>
        <div className="flex-start gap-3 pt-3">
          {isOwnProfile ? (
            <Button className="shad-button_secondary w-36 rounded-full">
              Edit Profile
            </Button>
          ) : (
            <>
              <Button className="shad-button_primary w-36 rounded-full">
                Follow
              </Button>
              <Button className="shad-button_secondary w-max rounded-full fill-white">
                <MessageIcon />
              </Button>
            </>
          )}
          <ProfileOptions
            profileOwnerId={userData?._id}
            userName={userData?.userName}
          />
        </div>
        {/* <div className="text-sm text-light-900">Rate this Profile</div> */}
      </section>

      <section className="flex items-start justify-between p-0">
        <div className="flex flex-col gap-2">
          <div className="flex-start">
            <h4
              className="connection-counting"
              onClick={() => handleConnectionModalOpen(0)}
            >
              {userData?.numberOfRating || 0}
              <span className="connection-counting-text">Ratings</span>
            </h4>

            <h4
              className="connection-counting"
              onClick={() => handleConnectionModalOpen(1)}
            >
              {userData?.followers}
              <span className="connection-counting-text">Followers</span>
            </h4>

            <h4
              className="connection-counting"
              onClick={() => handleConnectionModalOpen(2)}
            >
              {userData?.following}
              <span className="connection-counting-text">Followings</span>
            </h4>
          </div>

          {userData?.personalInfo?.shortBio && (
            <p className="w-96 pl-3 text-xs text-light-600">
              {userData?.personalInfo?.shortBio}
            </p>
          )}
        </div>
      </section>

      {showDP && (
        <Dialog open={showDP}>
          <PhotoViewModal
            imgURL={`${userData?.personalInfo?.profileImage}`}
            onClick={() => setShowDP(!showDP)}
          />
        </Dialog>
      )}

      {showConnection && (
        <Dialog open={showConnection}>
          <ConnectionListModal
            isTalent={true}
            currentTab={currentTab}
            onClick={() => setShowConnection(!showConnection)}
            setCuurentTab={(currentTab: number) => setCurrentTab(currentTab)}
          />
        </Dialog>
      )}
    </header>
  );
};

export default ProfileHeader;
