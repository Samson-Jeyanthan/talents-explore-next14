"use client";

import { SAVED_FOLDER_OPTIONS } from "@/constants";
import {
  Menubar,
  MenubarContent,
  MenubarItem,
  MenubarMenu,
  MenubarTrigger,
} from "../ui/menubar";
import { BsThreeDots } from "react-icons/bs";
import { CRUDSaveFolderModal } from "../modals";
import { useState } from "react";

type Props = {
  folderId: string;
  folderName: string;
};

const SaveFolderOptions = ({ folderId, folderName }: Props) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleFolderOptionClick = (num: number) => {
    if (num === 0) {
      setIsOpen(true);
    }
  };

  return (
    <>
      <Menubar className="relative rounded-full border-none bg-none p-0">
        <MenubarMenu>
          <MenubarTrigger className="cursor-pointer rounded-lg p-[4px] pr-[5px] text-lg text-light-500 hover:text-light-900">
            <BsThreeDots />
          </MenubarTrigger>
          <MenubarContent className="absolute -right-5 -top-2 min-w-36 gap-10 rounded-lg border border-solid border-dark-400 bg-dark-300 p-2 shadow-xl shadow-dark-100/25">
            {SAVED_FOLDER_OPTIONS.map((item, index) => (
              <MenubarItem
                key={index}
                className={`${item.isRed ? "fill-custom-200 text-custom-200" : "fill-light-600 text-light-600"} w-full cursor-pointer gap-2 rounded bg-dark-300 text-base hover:bg-dark-400 hover:fill-light-900 hover:text-light-900`}
                onClick={() => handleFolderOptionClick(index)}
              >
                <item.icon />
                <p className="text-xs">{item.name}</p>
              </MenubarItem>
            ))}
          </MenubarContent>
        </MenubarMenu>
      </Menubar>

      <CRUDSaveFolderModal
        isFor="EDIT"
        isOpen={isOpen}
        folderId={folderId}
        folderName={folderName}
        onClick={() => setIsOpen(false)}
      />
    </>
  );
};

export default SaveFolderOptions;
