"use client";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogOverlay,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "../ui/input";
import { useState } from "react";
import { toast } from "sonner";

type Props = {
  isFor: "CREATE" | "EDIT" | "DELETE";
  isOpen: boolean;
  folderId?: string;
  folderName?: string;
  onClick: () => void;
};

const CRUDSaveFolder = ({
  isFor,
  isOpen,
  folderId,
  folderName,
  onClick,
}: Props) => {
  const [value, setValue] = useState(folderName || "");

  const handleSubmit = () => {
    console.log(value);
    setValue("");
    toast.success("Folder Renamed", { duration: 4000 });
    onClick();
  };

  return (
    <AlertDialog open={isOpen}>
      <AlertDialogOverlay />
      <AlertDialogContent className="rounded-2xl border-none bg-dark-250 p-4 text-light-900">
        <AlertDialogHeader className="flex flex-col gap-3">
          <AlertDialogTitle>Rename Save Collection Folder</AlertDialogTitle>
          <AlertDialogDescription>
            <Input
              type="text"
              id="folder"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder="Add Folder Name"
              className="shad-auth_form_input border border-solid border-dark-300"
            />
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="mt-4 flex gap-3">
          <AlertDialogCancel
            onClick={onClick}
            className="w-24 rounded-full border-none bg-none text-light-900 hover:bg-dark-400"
          >
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            disabled={value === "" || value === folderName}
            onClick={handleSubmit}
            className="shad-btn_primary-200 border-none"
          >
            Continue
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default CRUDSaveFolder;
