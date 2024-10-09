"use client";

import React, { useRef, ChangeEvent, useState } from "react";
import Image from "next/image";
import { MdEdit } from "react-icons/md";
import { Dialog } from "../ui/dialog";
import { CropImgModal, ErrorAlert, PhotoActionModal } from "../modals";
import { CameraIcon } from "@/public/assets/svgs";
import { defaultMediaState, useCoverAndProfilePic } from "@/lib/hooks/useMedia";
import { TCoverProfilePhotoProps } from "@/types/utils.types";

const ProfilePhoto = ({ fieldChange, mediaUrl }: TCoverProfilePhotoProps) => {
  const photoRef = useRef<HTMLInputElement>(null);
  const { handleImageInput, media, resetMedia, error, setError, setMedia } =
    useCoverAndProfilePic();
  const [isOpen, setIsOpen] = useState(false);
  const [isActionOpen, setIsActionOpen] = useState(false);
  const [prevMedia, setPrevMedia] = useState(mediaUrl || null);
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
    if (finalCropImage || prevMedia) {
      setIsActionOpen(true);
    } else {
      photoRef.current?.click();
    }
  };

  // delete the cropped photo
  const handleDelete = () => {
    setFinalCropImage(null);
    setPrevMedia(null);
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
      <div className="flex-center relative -mt-20 ml-12 size-36 rounded-full bg-dark-400 shadow-sm">
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
            prevMedia ||
            "/assets/images/default_profile_pic_2.png"
          }
          alt="profile_pic"
          width={512}
          height={512}
          className="size-36 rounded-full object-cover"
        />

        <div
          className="camera-button !bottom-0 !right-1 !rounded-full fill-white text-white"
          onClick={handleInputBtn}
        >
          {finalCropImage || prevMedia ? (
            <MdEdit fill="white" />
          ) : (
            <CameraIcon fill="white" width="21px" height="21px" />
          )}
        </div>
      </div>

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
    </>
  );
};

export default ProfilePhoto;
