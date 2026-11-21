"use client";

import React, { useRef, ChangeEvent, useState, useEffect } from "react";
import Image from "next/image";
import { MdEdit } from "react-icons/md";
import { Dialog } from "../ui/dialog";
import { CropImgModal, ErrorAlert, PhotoActionModal } from "../modals";
import { CameraIcon } from "@/public/assets/svgs";
import { useMediaSelection } from "@/lib/hooks/useMedia";
import { profileImageError } from "@/lib/utils/profile-editor";
import { TCoverProfilePhotoProps } from "@/types/utils.types";

const ProfilePhoto = ({ fieldChange, mediaUrl }: TCoverProfilePhotoProps) => {
  const photoRef = useRef<HTMLInputElement>(null);
  const { handleMediaInput, media, resetMedia, error, setError } =
    useMediaSelection(true);
  const [isOpen, setIsOpen] = useState(false);
  const [isActionOpen, setIsActionOpen] = useState(false);
  const [prevMedia, setPrevMedia] = useState(mediaUrl || null);
  const [finalCropImage, setFinalCropImage] = useState<string | null>(null);
  useEffect(
    () => () => {
      if (finalCropImage) URL.revokeObjectURL(finalCropImage);
    },
    [finalCropImage],
  );
  useEffect(
    () => () => {
      if (media.preview) URL.revokeObjectURL(media.preview);
    },
    [media.preview],
  );

  // handle image input change
  const handleInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const message = profileImageError(file);
    if (message) {
      setError(message);
      event.target.value = "";
      return;
    }
    handleMediaInput(event);
    event.target.value = "";
    setIsOpen(true);
    setIsActionOpen(false);
  };

  // image crop compelte function
  const handleCropComplete = (img: any) => {
    const message = profileImageError(img?.croppedData);
    if (message) {
      setError(message);
      return;
    }
    setFinalCropImage(img.croppedPrev);
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
    fieldChange(null);
    setIsActionOpen(false);
  };

  // handling invalid media
  const handleOkClick = () => {
    setError("");
    resetMedia();
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
          className="!size-36 rounded-full object-cover"
        />

        <button
          type="button"
          aria-label="Edit profile photo"
          className="camera-button !bottom-0 !right-1 !rounded-full fill-white text-white"
          onClick={handleInputBtn}
        >
          {finalCropImage || prevMedia ? (
            <MdEdit fill="white" />
          ) : (
            <CameraIcon fill="white" width="21px" height="21px" />
          )}
        </button>
      </div>

      <ErrorAlert
        isOpen={Boolean(error)}
        title="OOPS! Something went wrong"
        error={error}
        onClick={handleOkClick}
      />
      <Dialog
        open={isOpen && !!media.data && !error}
        onOpenChange={() => {
          setIsOpen(false);
          resetMedia();
        }}
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
