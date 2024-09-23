"use client";

import {
  Menubar,
  MenubarContent,
  MenubarItem,
  MenubarMenu,
  MenubarTrigger,
} from "@/components/ui/menubar";
import { PROFILE_OPTIONS } from "@/constants";
import { useUserContext } from "@/context/AuthProvider";
import { getLinkCopied } from "@/lib/utils";
import React from "react";
import { BsThreeDotsVertical } from "react-icons/bs";

type Prop = {
  profileOwnerId: string;
  userName: string;
};

const ProfileOptions = ({ profileOwnerId, userName }: Prop) => {
  const { user } = useUserContext();
  const isOwnProfile = profileOwnerId === user?.currentUserId;

  const handleProfileOptionClick = (id: number) => {
    if (id === 0) {
      const linkToCopy =
        process.env.NEXT_PUBLIC_DOMAIN_URL +
        "/profile/" +
        userName +
        "/" +
        profileOwnerId;
      getLinkCopied(linkToCopy);
    }
  };

  return (
    <Menubar className="relative rounded-full border-none bg-dark-300 p-0">
      <MenubarMenu>
        <MenubarTrigger className="cursor-pointer rounded-lg text-lg text-light-800 hover:text-light-900">
          <BsThreeDotsVertical />
        </MenubarTrigger>
        <MenubarContent className="absolute -right-5 min-w-36 gap-10 rounded-lg border border-solid border-dark-400 bg-dark-300 p-2 shadow-xl shadow-dark-100/25">
          {PROFILE_OPTIONS.map((item, index) => (
            <React.Fragment key={index}>
              {isOwnProfile === item.isOwnProfile && (
                <MenubarItem
                  className={`${item.isRed ? "fill-custom-200 text-custom-200" : "fill-light-600 text-light-600"} w-full cursor-pointer gap-3 rounded bg-dark-300 text-base hover:bg-dark-400 hover:fill-light-900 hover:text-light-900`}
                  onClick={() => handleProfileOptionClick(item.id)}
                >
                  {item.height ? (
                    <item.icon height={item.height} width={item.height} />
                  ) : (
                    <item.icon />
                  )}
                  <p className="text-xs">{item.name}</p>
                </MenubarItem>
              )}
            </React.Fragment>
          ))}
        </MenubarContent>
      </MenubarMenu>
    </Menubar>
  );
};

export default ProfileOptions;
