"use client";

import Image from "next/image";
import { Button } from "../../ui/button";
import { ProfileOptions } from "../../options";
import { useState } from "react";
import { PhotoViewModal } from "../../modals";
import { Dialog } from "../../ui/dialog";
import ConnectionListModal from "../../modals/ConnectionListModal";
import { useUserContext } from "@/context/AuthProvider";
import { StarRating } from "@/components/inputs";
import { TCurrentUserData, TPublicUserData } from "@/types/profile.types";
import { usePathname, useRouter } from "next/navigation";
import ChatLauncher from "../ChatLauncher";

const ProfileHeader = ({
  userData,
  isOwnProfile,
}: {
  userData: TCurrentUserData | TPublicUserData;
  isOwnProfile: boolean;
}) => {
  const { user } = useUserContext();
  const router = useRouter();
  const pathname = usePathname();
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
    <header className="flex w-full flex-col bg-gradient-to-b from-[rgb(17,19,27,0.45)] to-[rgba(17,19,27)] p-2 pt-1 backdrop-blur-lg 2xl:-mt-10 2xl:p-0">
      <section className="flex items-start justify-between p-2 2xl:p-3">
        <div className="flex-start gap-5">
          <Image
            src={`${userData?.personalInfo?.profileImage ? userData?.personalInfo?.profileImage : "/assets/images/default_profile_pic_2.png"}`}
            width={1024}
            height={1024}
            alt="profile photo"
            className="size-16 cursor-pointer rounded-full bg-dark-400 object-cover xl:size-24"
            onClick={handleShowDP}
          />
          <div className="flex flex-col gap-2">
            <h1 className="text-[22px] font-semibold lowercase text-light-900 sm:text-3xl 2xl:text-4xl">
              @{userData?.userName}
            </h1>
            <p className="flex-start gap-1 text-sm text-light-900">
              {userData?.personalInfo?.professional}
            </p>
          </div>
        </div>
        {user.currentUserId ? (
          <div className="flex-start gap-3 pt-2 2xl:pt-3">
            {isOwnProfile ? (
              <Button
                className="shad-button_secondary w-36 rounded-full"
                onClick={() => router.push(`/profile/edit/${userData?._id}`)}
              >
                Edit Profile
              </Button>
            ) : (
              <>
                <Button className="shad-button_primary w-36 rounded-full">
                  Follow
                </Button>
                <ChatLauncher
                  userId={userData?._id}
                  iconOnly
                  className="shad-button_secondary rounded-full fill-white !px-3"
                />
              </>
            )}
            <ProfileOptions
              profileOwnerId={userData?._id}
              userName={userData?.userName}
            />
          </div>
        ) : null}
      </section>

      <section className="flex items-start justify-between">
        <div className="flex flex-col gap-1 2xl:gap-2">
          <div className="flex-center sm:flex-start">
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
            <p className="max-w-96 pl-3 text-xs text-light-600">
              {userData?.personalInfo?.shortBio}
            </p>
          )}
        </div>

        {user.currentUserId ? (
          <div className="flex items-center gap-2 pr-3 text-sm text-light-500">
            <p>Rate {isOwnProfile ? "your" : "this"} profile</p>
            <StarRating
              prevRatingValue={userData.yourRating}
              ratingFor="PROFILE"
              authorId={userData._id}
              revalidatePath={pathname}
            />
          </div>
        ) : null}
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
