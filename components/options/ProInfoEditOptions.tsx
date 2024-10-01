"use client";

import {
  Menubar,
  MenubarContent,
  MenubarItem,
  MenubarMenu,
  MenubarTrigger,
} from "@/components/ui/menubar";
import { HiOutlinePencil } from "react-icons/hi2";
import { MdDelete, MdModeEdit } from "react-icons/md";

const ProInfoEditOptions = () => {
  return (
    <Menubar className="relative m-0 size-min border-none p-0">
      <MenubarMenu>
        <MenubarTrigger className="cursor-pointer text-sm text-light-500 hover:text-light-900">
          <HiOutlinePencil />
        </MenubarTrigger>
        <MenubarContent className="absolute -right-5 min-w-36 gap-10 rounded-lg border border-solid border-dark-400 bg-dark-300 p-2 shadow-xl shadow-dark-100/25">
          <MenubarItem
            className="menubar-options-item"
            //   onClick={() => handleProfileOptionClick(item.id)}
          >
            <MdModeEdit />
            <p className="text-xs">Edit</p>
          </MenubarItem>
          <MenubarItem
            className="menubar-options-item"
            //   onClick={() => handleProfileOptionClick(item.id)}
          >
            <MdDelete />
            <p className="text-xs">Delete</p>
          </MenubarItem>
        </MenubarContent>
      </MenubarMenu>
    </Menubar>
  );
};

export default ProInfoEditOptions;
