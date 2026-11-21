"use client";

import { useRef, ChangeEvent, useState, useEffect } from "react";
import { Dialog } from "../ui/dialog";
import { CropImgModal, PhotoActionModal, ErrorAlert } from "../modals";
import { CameraIcon } from "@/public/assets/svgs";
import { useMediaSelection } from "@/lib/hooks/useMedia";
import Image from "next/image";
import { profileImageError } from "@/lib/utils/profile-editor";
import { TCoverProfilePhotoProps } from "@/types/utils.types";
import { MdEdit } from "react-icons/md";

const CoverPhoto = ({ fieldChange, mediaUrl }: TCoverProfilePhotoProps) => {
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

        <button
          type="button"
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
