"use client";

import Image from "next/image";
import { GoDotFill } from "react-icons/go";
import { Button } from "../ui/button";
import { ProfileOptions } from "../options";
import { useState } from "react";
import { Dialog } from "../ui/dialog";
import { PhotoViewModal } from "../modals";

const NormalUserProfileHeader = ({
  userData,
  isOwnProfile,
}: {
  userData: any;
  isOwnProfile: boolean;
}) => {
  const [showDP, setShowDP] = useState(false);

  return (
    <header className="relative flex w-full max-w-screen-xl justify-between py-4">
      <section className="flex items-start justify-start gap-5">
        <Image
          src={`${userData?.personalInfo?.profileImage ? userData?.personalInfo?.profileImage : "/assets/images/default_profile_pic_2.png"}`}
          width={1024}
          height={1024}
          alt="profile photo"
          className="relative size-24 cursor-pointer rounded-full bg-dark-400 object-cover"
          onClick={() => setShowDP(!showDP)}
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
            {userData?.personalInfo?.firstName}{" "}
            {userData?.personalInfo?.lastName}
          </h1>
          <p className="flex-start gap-1 text-sm text-light-900">
            @{userData?.userName} <GoDotFill className="text-[8px]" />{" "}
            {userData?.personalInfo?.professional}
          </p>
          {userData?.personalInfo?.shortBio && (
            <p className="w-96 text-xs text-light-600">
              {userData?.personalInfo?.shortBio}
            </p>
          )}
          <h4 className="connection-counting mt-2 w-max bg-dark-300">
            {userData?.following}
            <span className="connection-counting-text">Followings</span>
          </h4>
        </div>
      </section>

      <section className="flex items-start justify-between gap-3">
        <Button className="shad-button_primary w-36">Follow</Button>
        <Button className="shad-button_secondary w-36">Message</Button>
        <ProfileOptions />
      </section>
    </header>
  );
};

export default NormalUserProfileHeader;
