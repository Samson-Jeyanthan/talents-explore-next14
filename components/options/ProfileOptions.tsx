"use client";

import {
  Menubar,
  MenubarContent,
  MenubarItem,
  MenubarMenu,
  MenubarTrigger,
} from "@/components/ui/menubar";
import { BsThreeDotsVertical } from "react-icons/bs";

const ProfileOptions = () => {
  return (
    <Menubar className="relative border-none bg-dark-300 p-0">
      <MenubarMenu>
        <MenubarTrigger className="cursor-pointer rounded-lg text-lg text-light-800 hover:text-light-900">
          <BsThreeDotsVertical />
        </MenubarTrigger>
        <MenubarContent className="absolute -right-5 top-1 min-w-32 gap-10 rounded-lg border-2 border-solid border-dark-400 bg-dark-300 p-2 shadow-xl">
          <MenubarItem>Share</MenubarItem>
          <MenubarItem>Report</MenubarItem>
          <MenubarItem>Block</MenubarItem>
        </MenubarContent>
      </MenubarMenu>
    </Menubar>
  );
};

export default ProfileOptions;
