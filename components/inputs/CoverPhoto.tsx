"use client";

import React, { useRef, ChangeEvent, useState } from "react";
import { Dialog } from "../ui/dialog";
import { CropImgModal, PhotoActionModal } from "../modals";
import { CameraIcon } from "@/public/assets/svgs";
import { useMedia } from "@/lib/hooks/useMedia";
import Image from "next/image";
import { TCoverProfilePhotoProps } from "@/types/utils.types";
import { MdEdit } from "react-icons/md";

const CoverPhoto = ({ fieldChange, mediaUrl }: TCoverProfilePhotoProps) => {
  const photoRef = useRef<HTMLInputElement>(null);
  const { handleImageInput, media, resetMedia, error } = useMedia();
  const [isOpen, setIsOpen] = useState(false);
  const [finalCropImage, setFinalCropImage] = useState(null);
  const [isActionOpen, setIsActionOpen] = useState(null);

  const handleInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    handleImageInput(event);
    setIsOpen(true);
    setIsActionOpen(false);
  };

  const handleCropComplete = (img: any) => {
    setFinalCropImage(img?.croppedPrev);
    setIsOpen(false);
    resetMedia();
  };

  const handleInputBtn = () => {
    if (finalCropImage === null) {
      photoRef.current?.click();
    } else {
      setIsActionOpen(true);
    }
  };

  const handleDelete = () => {
    setFinalCropImage(null);
    setIsActionOpen(false);
  };

  return (
    <>
      <Dialog
        open={isOpen && media && !error}
        onOpenChange={() => setIsOpen(false)}
      >
        <CropImgModal
          modalFor="cover"
          media={media}
          handleCropComplete={handleCropComplete}
        />
      </Dialog>
      <Dialog open={isActionOpen} onOpenChange={() => setIsActionOpen(false)}>
        <PhotoActionModal
          photoActionFor="cover"
          onInputChange={handleInputChange}
          onDelete={handleDelete}
        />
      </Dialog>
      <div
        className={`flex-center relative flex ${finalCropImage ? "h-auto" : "h-96"} max-h-96 min-h-48 w-full rounded-lg bg-dark-300`}
      >
        <input
          type="file"
          ref={photoRef}
          hidden
          onChange={handleInputChange}
          accept="image/jpeg,image/jpg,image/png,image/webp"
        />

        {finalCropImage ? (
          <Image
            src={finalCropImage}
            alt="cropped-cover-image"
            width={1000}
            height={1000}
            className="size-full rounded-lg object-cover"
          />
        ) : (
          <p className="text-center text-sm text-light-500">
            Drag and drop or
            <br />
            click the button to add cover photo
          </p>
        )}

        <div
          className="shad-button_dark absolute bottom-2 right-2"
          onClick={handleInputBtn}
        >
          {finalCropImage || mediaUrl ? (
            <div className="grid place-items-center text-base">
              <MdEdit fill="white" />
            </div>
          ) : (
            <CameraIcon fill="white" width="21px" height="21px" />
          )}
          {finalCropImage ? "Edit Cover Photo" : "Add Cover Photo"}
        </div>
      </div>
    </>
  );
};

export default CoverPhoto;
