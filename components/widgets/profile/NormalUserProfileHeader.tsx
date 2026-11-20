"use client";

import Image from "next/image";
import { Button } from "../../ui/button";
import { ProfileOptions } from "../../options";
import { useState } from "react";
import { Dialog } from "../../ui/dialog";
import { PhotoViewModal } from "../../modals";
import ConnectionListModal from "../../modals/ConnectionListModal";
import ChatLauncher from "../ChatLauncher";
import { getProfileVisibilityState } from "@/lib/utils/profilePrivacy";
import { useRouter } from "next/navigation";
import ConnectionButton from "@/components/buttons/ConnectionButton";
import { followFlag } from "@/lib/utils/connections";

const NormalUserProfileHeader = ({
  userData,
  isOwnProfile,
}: {
  userData: any;
  isOwnProfile: boolean;
}) => {
  const [showDP, setShowDP] = useState(false);
  const [showConnection, setShowConnection] = useState(false);
  const visibility = getProfileVisibilityState(userData, isOwnProfile);
  const router = useRouter();

  const handleShowDP = () => {
    if (userData?.personalInfo?.profileImage) setShowDP(!showDP);
  };

  const handleConnectionModalOpen = () => {
    if (visibility.canViewFollowings) {
      setShowConnection(!showConnection);
    }
  };

  return (
    <header className="relative flex w-full max-w-screen-xl justify-between py-4">
      <section className="flex items-start justify-start gap-5">
        <Image
          src={`${userData?.personalInfo?.profileImage ? userData?.personalInfo?.profileImage : "/assets/images/default_profile_pic_2.png"}`}
          width={1024}
          height={1024}
          alt="profile photo"
          className="relative size-24 cursor-pointer rounded-full bg-dark-400 object-cover"
          onClick={handleShowDP}
        />

        {showDP && (
          <Dialog open={showDP}>
            <PhotoViewModal
              imgURL={`${userData?.personalInfo?.profileImage}`}
              onClick={() => setShowDP(!showDP)}
            />
          </Dialog>
        )}

        <div className="flex flex-col gap-1">
          <h1 className="text-4xl font-semibold text-light-900">
            @{userData?.userName}
          </h1>
          <p className="flex-start gap-1 text-sm text-light-900">
            {userData?.personalInfo?.professional}
          </p>
          {userData?.personalInfo?.shortBio && (
            <p className="w-96 text-xs text-light-600">
              {userData?.personalInfo?.shortBio}
            </p>
          )}
          {visibility.canViewFollowings ? (
            <button
              type="button"
              className="connection-counting mt-2 w-max bg-dark-300"
              onClick={handleConnectionModalOpen}
            >
              {userData?.following}
              <span className="connection-counting-text">Followings</span>
            </button>
          ) : null}
        </div>
      </section>

      <section className="flex items-start justify-between gap-3">
        {isOwnProfile ? (
          <Button
            className="shad-button_secondary w-36 rounded-full"
            onClick={() => router.push(`/profile/edit/${userData?._id}`)}
          >
            Edit Profile
          </Button>
        ) : (
          <>
            {followFlag(userData?.isFollowing) && (
              <ConnectionButton
                userId={userData._id}
                userName={userData.userName}
                isFollow={userData.isFollowing}
              />
            )}
            {visibility.canReceiveMessages ? (
              <ChatLauncher
                userId={userData?._id}
                iconOnly
                className="shad-button_secondary w-max rounded-full fill-light-900"
              />
            ) : null}
          </>
        )}
        <ProfileOptions
          profileOwnerId={userData?._id}
          userName={userData?.userName}
        />
      </section>
      {showConnection && (
        <Dialog open={showConnection} onOpenChange={setShowConnection}>
          <ConnectionListModal
            isTalent={false}
            onClick={() => setShowConnection(!showConnection)}
            currentTab={2}
            canViewRatings={false}
            canViewFollowers={false}
            canViewFollowings={visibility.canViewFollowings}
          />
        </Dialog>
      )}
    </header>
  );
};

export default NormalUserProfileHeader;
