"use client";

import {
  Menubar,
  MenubarContent,
  MenubarItem,
  MenubarMenu,
  MenubarTrigger,
} from "@/components/ui/menubar";
import { POST_OPTIONS } from "@/constants";
import { useUserContext } from "@/context/AuthProvider";
import {
  handlePinnedToProfile,
  handleRemoveFromProfile,
} from "@/lib/functions/post.functions";
import { cn, getLinkCopied } from "@/lib/utils";
import React, { useState } from "react";
import { BsThreeDotsVertical } from "react-icons/bs";

type Prop = {
  authorId: string;
  postId: string;
  isBestWork: boolean;
  className?: string;
};

const PostOptions = ({ authorId, postId, isBestWork, className }: Prop) => {
  const { user } = useUserContext();
  const isOwnPost = authorId === user?.currentUserId;
  const [isPinned, setIsPinned] = useState(isBestWork);

  const handlePostOptionClick = (id: number) => {
    if (id === 0) {
      if (isPinned) {
        handleRemoveFromProfile(
          user?.currentUserId,
          postId,
          `/profile/${user?.username}/${user?.currentUserId}/all-posts`
        );
        setIsPinned(false);
      } else {
        handlePinnedToProfile(
          user?.currentUserId,
          postId,
          `/profile/${user?.username}/${user?.currentUserId}/all-posts`
        );
        setIsPinned(true);
      }
    } else if (id === 1 || id === 4) {
      const linkToCopy = process.env.NEXT_PUBLIC_DOMAIN_URL + "/post/" + postId;
      getLinkCopied(linkToCopy);
    }
  };

  return (
    <Menubar className={cn(`rounded-full bg-dark-300 ${className}`)}>
      <MenubarMenu>
        <MenubarTrigger className="cursor-pointer rounded-lg text-lg text-light-700 hover:text-light-900">
          <BsThreeDotsVertical />
        </MenubarTrigger>
        <MenubarContent className="absolute -right-5 min-w-36 gap-10 rounded-lg border border-solid border-dark-400 bg-dark-300 p-2 shadow-xl shadow-dark-100/25">
          {POST_OPTIONS.map((item, index) => (
            <React.Fragment key={index}>
              {isOwnPost === item.isOwnPost && (
                <MenubarItem
                  className={`${item.isRed ? "fill-custom-200 text-custom-200" : "fill-light-600 text-light-600"} w-full cursor-pointer gap-3 rounded bg-dark-300 text-base hover:bg-dark-400 hover:fill-light-900 hover:text-light-900`}
                  onClick={() => handlePostOptionClick(item.id)}
                >
                  {item.height ? (
                    <item.icon height={item.height} width={item.height} />
                  ) : (
                    <item.icon />
                  )}
                  <p className="text-xs">
                    {index === 0
                      ? isPinned
                        ? "Remove Pin"
                        : "Pin on Profile"
                      : item.name}
                  </p>
                </MenubarItem>
              )}
            </React.Fragment>
          ))}
        </MenubarContent>
      </MenubarMenu>
    </Menubar>
  );
};

export default PostOptions;
