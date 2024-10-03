"use client";

import React, { useRef } from "react";
import {
  DialogClose,
  DialogContent,
  DialogOverlay,
  DialogTitle,
} from "../ui/dialog";
import { TPhotoActionProps } from "@/types/utils.types";
import { BiPlus } from "react-icons/bi";
import { MdClose, MdDelete } from "react-icons/md";

const PhotoAction = ({
  photoActionFor,
  onInputChange,
  onDelete,
}: TPhotoActionProps) => {
  const photoRef = useRef<HTMLInputElement>(null);

  return (
    <>
      <DialogOverlay />
      <DialogContent
        className="flex max-w-96 flex-col items-center gap-3 rounded-2xl border-none bg-dark-250 p-5"
        aria-describedby={undefined}
      >
        <header className="-mt-1 flex w-full items-center justify-between text-light-900">
          <DialogTitle>
            {photoActionFor === "profile"
              ? "Edit Profile Photo"
              : "Edit Cover Photo"}
          </DialogTitle>
          <DialogClose className="cursor-pointer rounded-full bg-dark-400 p-1 text-light-900">
            <MdClose className="text-xl" />
          </DialogClose>
        </header>

        <input
          type="file"
          ref={photoRef}
          hidden
          onChange={onInputChange}
          accept="image/jpeg,image/jpg,image/png,image/webp"
        />

        <div
          className="flex-center body-regular w-full cursor-pointer gap-2 rounded-md bg-dark-300 p-3 text-primary-500"
          onClick={onDelete}
        >
          <MdDelete className="text-xl" />
          {photoActionFor === "profile"
            ? "Delete Profile Photo"
            : "Delete Cover Photo"}
        </div>
        <div
          className="flex-center body-regular w-full cursor-pointer gap-2 rounded-md bg-dark-300 p-3 text-light-900"
          onClick={() => photoRef.current?.click()}
        >
          <BiPlus className="text-xl" /> Choose From Device
        </div>
      </DialogContent>
    </>
  );
};

export default PhotoAction;
