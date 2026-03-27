"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useUserContext } from "@/context/AuthProvider";
import Link from "next/link";

const CurrentUserAvatar = () => {
  const { user } = useUserContext();

  return (
    <Link href={`/profile/${user?.username}/${user?.currentUserId}`}>
      <Avatar className="size-9 cursor-pointer bg-dark-300 2xl:size-9">
        <AvatarImage src={user?.imageUrl || ""} className="object-cover" />
        <AvatarFallback className="bg-dark-300 text-light-900">
          {Array.from(user?.firstName)[0]}
          {Array.from(user?.lastName)[0]}
        </AvatarFallback>
      </Avatar>
    </Link>
  );
};

export const UserAvatar = ({
  size,
  url,
  userFN,
  userLN,
}: {
  size?: string;
  url: string;
  userFN: string;
  userLN: string;
}) => {
  return (
    <Avatar className={`${size} cursor-pointer bg-dark-300`}>
      <AvatarImage src={url} />
      <AvatarFallback className="text-light-900">
        {Array.from(userFN)[0]}
        {Array.from(userLN)[0]}
      </AvatarFallback>
    </Avatar>
  );
};

export default CurrentUserAvatar;
