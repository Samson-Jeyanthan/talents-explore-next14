"use client";

import { Menubar, MenubarMenu, MenubarTrigger } from "../ui/menubar";
import { BsThreeDots } from "react-icons/bs";

const SaveFolderOptions = () => {
  return (
    <Menubar className="relative rounded-full border-none bg-none p-0">
      <MenubarMenu>
        <MenubarTrigger className="cursor-pointer rounded-lg p-[4px] pr-[5px] text-lg text-light-500 hover:text-light-900">
          <BsThreeDots />
        </MenubarTrigger>
      </MenubarMenu>
    </Menubar>
  );
};

export default SaveFolderOptions;
