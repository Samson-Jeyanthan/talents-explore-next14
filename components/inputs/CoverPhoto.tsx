"use client";

import { useRef, ChangeEvent, useState } from "react";
import { Dialog } from "../ui/dialog";
import { CropImgModal, PhotoActionModal, ErrorAlert } from "../modals";
import { CameraIcon } from "@/public/assets/svgs";
import { defaultMediaState, useCoverAndProfilePic } from "@/lib/hooks/useMedia";
import Image from "next/image";
import { TCoverProfilePhotoProps } from "@/types/utils.types";
import { MdEdit } from "react-icons/md";

const CoverPhoto = ({ fieldChange, mediaUrl }: TCoverProfilePhotoProps) => {
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
      <div className="flex-center relative flex h-[20.5rem] max-h-[20.5rem] w-full rounded-xl bg-dark-300">
        <input
          type="file"
          ref={photoRef}
          hidden
          onChange={handleInputChange}
          accept="image/jpeg,image/jpg,image/png,image/webp"
        />

        {finalCropImage || prevMedia ? (
          <Image
            src={finalCropImage || prevMedia || ""}
            alt="cropped-cover-image"
            width={2048}
            height={1024}
            className="size-full rounded-xl object-cover"
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
          {finalCropImage || prevMedia ? (
            <div className="grid place-items-center text-base">
              <MdEdit fill="white" />
            </div>
          ) : (
            <CameraIcon fill="white" width="21px" height="21px" />
          )}
          {finalCropImage || prevMedia ? "Edit Cover Photo" : "Add Cover Photo"}
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
    </>
  );
};

export default CoverPhoto;
