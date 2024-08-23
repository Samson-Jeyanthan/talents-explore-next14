"use client";

import Image from "next/image";
import { GoDotFill } from "react-icons/go";
import { Button } from "../ui/button";
import { ProfileOptions } from "../options";
import { useState } from "react";
import { PhotoViewModal } from "../modals";
import { Dialog } from "../ui/dialog";

const ProfileHeader = ({ userData }: { userData: any }) => {
  const [showDP, setShowDP] = useState(false);
  return (
    <header className="-mt-32 flex w-full flex-col">
      <section className="flex items-end justify-between bg-gradient-to-t from-[rgb(17,19,27,0.75)] to-[rgba(17,19,27,0.0)] px-16 py-4">
        <div className="flex-start gap-5">
          <Image
            src={`${userData?.personalInfo?.profileImage}`}
            width={1024}
            height={1024}
            alt="profile photo"
            className="size-24 cursor-pointer rounded-full object-cover"
            onClick={() => setShowDP(!showDP)}
          />
          <div className="flex flex-col gap-1">
            <h1 className="text-6xl font-semibold text-light-900">
              {userData?.personalInfo?.firstName}{" "}
              {userData?.personalInfo?.lastName}
            </h1>
            <p className="flex-start gap-1 text-sm text-light-900">
              @{userData?.userName} <GoDotFill className="text-[8px]" />{" "}
              {userData?.personalInfo?.professional}
            </p>
          </div>
        </div>

        <div className="text-sm text-light-900">Rate this Profile</div>

        {showDP && (
          <Dialog open={showDP}>
            <PhotoViewModal
              imgURL={`${userData?.personalInfo?.profileImage}`}
              onClick={() => setShowDP(!showDP)}
            />
          </Dialog>
        )}
      </section>

      <section className="flex items-start justify-between bg-gradient-to-b from-[rgb(17,19,27,0.70)] to-[rgba(17,19,27)] px-12 pt-2 backdrop-blur-lg">
        <div className="flex flex-col gap-2">
          <div className="flex-start">
            <h4 className="connection-counting">
              {userData?.numberOfRating}
              <span className="connection-counting-text">Ratings</span>
            </h4>

            <h4 className="connection-counting">
              {userData?.followers}
              <span className="connection-counting-text">Followers</span>
            </h4>

            <h4 className="connection-counting">
              {userData?.following}
              <span className="connection-counting-text">Followings</span>
            </h4>
          </div>

          <p className="w-96 pl-3 text-xs text-light-600">
            {userData?.personalInfo?.shortBio}
          </p>
        </div>
        <div className="flex-start gap-3">
          <Button className="shad-button_primary w-36">Follow</Button>
          <Button className="shad-button_secondary w-36">Message</Button>
          <ProfileOptions />
        </div>
      </section>
    </header>
  );
};

export default ProfileHeader;
