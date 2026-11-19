"use client";

import { Pencil, Upload, X } from "lucide-react";
import Image from "next/image";
import React, { ChangeEvent, useEffect, useRef, useState } from "react";

const ShareThumbnailInput = ({ fieldChange, values }: any) => {
  const photoRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState("");
  const [preview, setPreview] = useState(
    typeof values === "string" ? values : values?.url || "",
  );
  useEffect(() => {
    if (values instanceof File) {
      const url = URL.createObjectURL(values);
      setPreview(url);
      return () => URL.revokeObjectURL(url);
    }
    setPreview(typeof values === "string" ? values : values?.url || "");
  }, [values]);

  const handleInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    const newFile = event.target.files?.[0];
    event.target.value = "";
    if (!newFile) return;
    if (
      !["image/jpeg", "image/png", "image/webp"].includes(newFile.type) ||
      !newFile.size ||
      newFile.size > 8 * 1024 * 1024
    ) {
      setError("Choose a JPEG, PNG, or WebP image up to 8 MB.");
      return;
    }
    setError("");
    fieldChange(newFile);
  };

  const handleInputDelete = () => {
    setError("");
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

      {preview ? (
        <div className="flex-center relative !size-40 min-w-40 rounded-lg">
          <div className="absolute bottom-1 right-1 flex gap-1">
            <button
              type="button"
              aria-label="Replace thumbnail"
              className="flex-center size-6 cursor-pointer rounded-full bg-dark-400 text-sm text-light-900"
              onClick={() => photoRef.current?.click()}
            >
              <Pencil className="size-3" />
            </button>
            <button
              type="button"
              aria-label="Remove thumbnail"
              className="flex-center size-6 cursor-pointer rounded-full bg-dark-400 text-sm text-light-900"
              onClick={handleInputDelete}
            >
              <X className="size-4" />
            </button>
          </div>
          <Image
            src={preview}
            width={100}
            height={100}
            alt="img"
            className="size-full rounded-lg object-cover"
          />
        </div>
      ) : (
        <button
          type="button"
          className="flex-center !size-40 min-w-40 cursor-pointer flex-col gap-2 rounded-lg border border-solid border-dark-300 bg-dark-300 text-light-500"
          onClick={() => photoRef.current?.click()}
        >
          <Upload />
          <p className="text-center text-sm">
            Upload <br /> thumbnail
          </p>
        </button>
      )}
      {error && (
        <p role="alert" className="text-sm text-red-500">
          {error}
        </p>
      )}
    </>
  );
};

export default ShareThumbnailInput;
