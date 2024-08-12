"use client";

import React, { useRef, ChangeEvent, useState } from "react";
import Image from "next/image";
import { MdEdit } from "react-icons/md";
import { Dialog } from "../ui/dialog";
import { CropImgModal, ErrorAlert, PhotoActionModal } from "../modals";
import { CameraIcon } from "@/public/assets/svgs";
import { defaultMediaState, useMedia } from "@/lib/hooks/useMedia";
import { TCoverProfilePhotoProps } from "@/types/utils.types";

const ProfilePhoto = ({ fieldChange, mediaUrl }: TCoverProfilePhotoProps) => {
  const photoRef = useRef<HTMLInputElement>(null);
  const { handleImageInput, media, resetMedia, error, setError, setMedia } =
    useMedia();
  const [isOpen, setIsOpen] = useState(false);
  const [isActionOpen, setIsActionOpen] = useState(false);
  const [finalCropImage, setFinalCropImage] = useState(null);

  // handle image input change
  const handleInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    handleImageInput(event);
    setIsOpen(true);
    setIsActionOpen(false);
  };

  // image crop compelte function
  const handleCropComplete = (img: any) => {
    setFinalCropImage(img?.croppedPrev);
    fieldChange(img.croppedData);
    setIsOpen(false);
    resetMedia();
  };

  // handle the photo action modal open and input change
  const handleInputBtn = () => {
    if (finalCropImage === null) {
      photoRef.current?.click();
    } else {
      setIsActionOpen(true);
    }
  };

  // delete the cropped photo
  const handleDelete = () => {
    setFinalCropImage(null);
    setIsActionOpen(false);
  };

  // handling invalid media
  const handleOkClick = () => {
    setError("");
    setMedia(defaultMediaState);
    setIsOpen(false);
  };

  return (
    <>
      <ErrorAlert
        isOpen={Boolean(error)}
        title="OOPS! Something went wrong"
        error={error}
        onClick={handleOkClick}
      />
      <Dialog
        open={isOpen && media && !error}
        onOpenChange={() => setIsOpen(false)}
      >
        <CropImgModal
          modalFor="profile"
          media={media}
          handleCropComplete={handleCropComplete}
        />
      </Dialog>
      <Dialog open={isActionOpen} onOpenChange={() => setIsActionOpen(false)}>
        <PhotoActionModal
          photoActionFor="profile"
          onInputChange={handleInputChange}
          onDelete={handleDelete}
        />
      </Dialog>
      <div className="flex-center absolute -bottom-16 left-8 h-[9.3rem] w-28 rounded-lg bg-dark-400">
        <input
          type="file"
          ref={photoRef}
          hidden
          onChange={handleInputChange}
          accept="image/jpeg,image/jpg,image/png,image/webp"
        />
        <Image
          src={
            finalCropImage ||
            mediaUrl ||
            "/assets/images/default_profile_pic.png"
          }
          alt="camera_icon"
          width={120}
          height={120}
          className="rounded-lg object-cover"
        />
        <div className="relative flex size-full">
          <div
            className="camera-button fill-white text-white"
            onClick={handleInputBtn}
          >
            {finalCropImage || mediaUrl ? (
              <MdEdit fill="white" />
            ) : (
              <CameraIcon fill="white" width="21px" height="21px" />
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default ProfilePhoto;
