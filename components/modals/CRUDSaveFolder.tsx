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
import { handleDeleteSaveCollection } from "@/lib/functions/post.functions";

type Props = {
  isFor: "CREATE" | "EDIT" | "DELETE";
  isOpen: boolean;
  folderId: string;
  folderName: string;
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
    if (isFor === "EDIT") {
      console.log(value);
      toast.success("Folder Renamed", { duration: 4000 });
    } else {
      handleDeleteSaveCollection(folderId);
    }
    setValue("");
    onClick();
  };

  return (
    <AlertDialog open={isOpen}>
      <AlertDialogOverlay />
      <AlertDialogContent className="max-w-[26rem] rounded-2xl border-none bg-dark-250 p-4 text-light-900">
        <AlertDialogHeader className="flex flex-col gap-2">
          <AlertDialogTitle className="capitalize">
            {isFor === "EDIT" ? "Rename This" : `Delete ${folderName}`} Folder
          </AlertDialogTitle>
          <AlertDialogDescription>
            {isFor === "EDIT" ? (
              <Input
                type="text"
                id="folder"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                placeholder="Add Folder Name"
                className="shad-auth_form_input border border-solid border-dark-300"
              />
            ) : (
              <p>
                You will permanently delete this folder. Are you sure you want
                to delete this folder?
              </p>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="mt-4 flex gap-2">
          <AlertDialogCancel
            onClick={onClick}
            className="rounded-full border-none bg-none text-light-900 hover:bg-dark-400"
          >
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            disabled={
              value === "" || (value === folderName && isFor === "EDIT")
            }
            onClick={handleSubmit}
            className="shad-btn_primary-200 border-none"
          >
            {isFor === "EDIT" ? "Continue" : "Delete"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default CRUDSaveFolder;
