"use client";

import { Button } from "../ui/button";
import { useState } from "react";
import { handleFollowUnFollow } from "@/lib/functions/connect.functions";
import { useUserContext } from "@/context/AuthProvider";
import { useParams } from "next/navigation";

interface ConnectionButtonProps {
  isFollow: number;
  viewerId: string | undefined;
  userId: string;
  userName: string;
  isOwnProfile: boolean;
  connectionTab?: number;
}

function ConnectionButton({
  isFollow,
  viewerId,
  userId,
  userName,
  isOwnProfile,
  connectionTab,
}: ConnectionButtonProps) {
  const [isFollowed, setIsFollowed] = useState(isFollow);
  const { user } = useUserContext();
  const params = useParams();
  const isCurrentUserProfile = user.currentUserId === params.userId;

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
          {isFollowed === 1
            ? isCurrentUserProfile && connectionTab === 2
              ? "Unfollow"
              : "Following"
            : "Follow"}
        </Button>
      )}
    </>
  );
}

export default ConnectionButton;
