"use client";

import { useState } from "react";
import { CRUDSaveFolderModal } from "../modals";
import { FaPlus } from "react-icons/fa6";

const CreateSaveFolder = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <div
        onClick={() => setIsOpen(true)}
        className="flex cursor-pointer items-center gap-2 text-sm font-normal text-custom-100"
      >
        <FaPlus />
        Create new folder
      </div>

      <CRUDSaveFolderModal
        isFor="CREATE"
        isOpen={isOpen}
        folderId=""
        folderName=""
        onClick={() => setIsOpen(false)}
      />
    </>
  );
};

export default CreateSaveFolder;
