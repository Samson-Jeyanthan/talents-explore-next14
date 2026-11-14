"use client";

import { useMediaSelection } from "@/lib/hooks/useMedia";
import { Paperclip, X } from "lucide-react";
import Image from "next/image";
import { ChangeEvent, useRef } from "react";

const CertificateInput = ({ fieldChange, values }: any) => {
  const mediaRef = useRef<HTMLInputElement>(null);
  const { handleMediaInput, error, media } = useMediaSelection(false);

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
        ref={mediaRef}
        hidden
        onChange={handleInputChange}
        accept="image/jpeg,image/jpg,image/png,image/webp/application/pdf"
      />

      <div className="flex-center relative !h-20 w-full gap-2 rounded-lg border border-solid border-dark-300 bg-dark-300 p-2 text-light-500">
        {values ? (
          <div className="flex-center gap-2">
            <Image
              src={
                media.fileType === "application/pdf"
                  ? "/assets/images/pdf.png"
                  : "/assets/images/image.png"
              }
              width={512}
              height={512}
              alt="profile-pic"
              className="h-10 w-auto bg-transparent object-cover"
            />
            <p
              className="w-3/5 truncate text-sm"
              title={media?.fileName ?? undefined}
            >
              {media.fileName}
            </p>
          </div>
        ) : (
          <div
            className="flex-center size-full cursor-pointer gap-2"
            onClick={() => mediaRef.current?.click()}
          >
            <Paperclip className="size-5" />
            <p className="text-center text-sm">Upload document</p>
          </div>
        )}
        {values && (
          <span
            className="absolute right-3 top-3 cursor-pointer text-white"
            onClick={handleInputDelete}
          >
            <X size={16} />
          </span>
        )}
      </div>
    </>
  );
};

export default CertificateInput;
