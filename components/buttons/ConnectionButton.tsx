"use client";

import { Button } from "../ui/button";
import { useState } from "react";
import { handleFollowUnFollow } from "@/lib/functions/connect.functions";

interface ConnectionButtonProps {
  isFollow: number;
  viewerId: string | undefined;
  userId: string;
  userName: string;
  isOwnProfile: boolean;
}

function ConnectionButton({
  isFollow,
  viewerId,
  userId,
  userName,
  isOwnProfile,
}: ConnectionButtonProps) {
  const [isFollowed, setIsFollowed] = useState(isFollow);

  const handleConnection = () => {
    handleFollowUnFollow(isFollowed, viewerId, userId, userName, setIsFollowed);
  };

  return (
    <>
      {isOwnProfile ? (
        <p className="flex-center h-8 w-24 text-sm text-light-600">You</p>
      ) : (
        <Button
          className={`${isFollowed === 1 ? "border border-solid border-primary-500 bg-none text-primary-500" : "bg-primary-500 text-light-900"} connection-btn rounded-full`}
          onClick={handleConnection}
        >
          {isFollowed === 1 ? "Following" : "Follow"}
        </Button>
      )}
    </>
  );
}

export default ConnectionButton;
