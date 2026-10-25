"use client";

import { useMediaSelection } from "@/lib/hooks/useMedia";
import { Pencil, Upload, X } from "lucide-react";
import Image from "next/image";
import React, { ChangeEvent, useRef } from "react";

const ShareThumbnailInput = ({ fieldChange, values }: any) => {
  const photoRef = useRef<HTMLInputElement>(null);
  const { handleMediaInput, error } = useMediaSelection(true);

  const handleInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    handleMediaInput(event);
    console.log(error);
    if (!event.target.files) return;
    const newFile = event.target.files[0];

    if (!error) {
      fieldChange(newFile);
    }
  };

  const handleInputDelete = () => {
    fieldChange(null);
  };

  return (
    <>
      <input
        type="file"
        ref={photoRef}
        hidden
        onChange={handleInputChange}
        accept="image/jpeg,image/jpg,image/png,image/webp"
      />

      {values ? (
        <div className="flex-center relative !size-40 min-w-40 rounded-lg">
          <div className="absolute bottom-1 right-1 flex gap-1">
            <span
              className="flex-center size-6 cursor-pointer rounded-full bg-dark-400 text-sm text-light-900"
              onClick={() => photoRef.current?.click()}
            >
              <Pencil className="size-3" />
            </span>
            <span
              className="flex-center size-6 cursor-pointer rounded-full bg-dark-400 text-sm text-light-900"
              onClick={handleInputDelete}
            >
              <X className="size-4" />
            </span>
          </div>
          <Image
            src={URL.createObjectURL(values)}
            width={100}
            height={100}
            alt="img"
            className="size-full rounded-lg object-cover"
          />
        </div>
      ) : (
        <div
          className="flex-center !size-40 min-w-40 cursor-pointer flex-col gap-2 rounded-lg border border-solid border-dark-300 bg-dark-300 text-light-500"
          onClick={() => photoRef.current?.click()}
        >
          <Upload />
          <p className="text-center text-sm">
            Upload <br /> thumbnail
          </p>
        </div>
      )}
    </>
  );
};

export default ShareThumbnailInput;
