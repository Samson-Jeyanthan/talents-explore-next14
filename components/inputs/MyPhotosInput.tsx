"use client";
import { useEffect, useRef, useState, type ChangeEvent } from "react";
import Image from "next/image";
import { BiPlus } from "react-icons/bi";
import { MdDelete } from "react-icons/md";
import { profileImageError } from "@/lib/utils/profile-editor";

export const MyPhotosImgCard = ({
  onClick,
  src,
  alt,
}: {
  onClick: () => void;
  src: string;
  alt: string;
}) => (
  <div className="group relative size-32 rounded-md">
    <button
      type="button"
      aria-label={"Remove " + alt}
      onClick={onClick}
      className="flex-center hover:myphotos-gradient absolute left-0 top-0 z-10 size-full cursor-pointer rounded-md text-white opacity-100 transition-opacity duration-500 focus-visible:opacity-100 sm:opacity-0 sm:group-hover:opacity-100"
    >
      <MdDelete className="rounded-full bg-black/50 p-1 text-3xl" />
    </button>
    <Image
      src={src}
      alt={alt}
      width={512}
      height={512}
      className="!max-h-32 !min-h-32 !min-w-32 !max-w-32 rounded-md !object-cover"
    />
  </div>
);
function SelectedPhoto({
  file,
  onDelete,
}: {
  file: File;
  onDelete: () => void;
}) {
  const [url, setUrl] = useState("");
  useEffect(() => {
    const next = URL.createObjectURL(file);
    setUrl(next);
    return () => URL.revokeObjectURL(next);
  }, [file]);
  return url ? (
    <MyPhotosImgCard src={url} alt={file.name} onClick={onDelete} />
  ) : null;
}
export default function MyPhotosInput({
  prevURLs = [],
  setPrevURLs,
  values = [],
  fieldChange,
}: {
  prevURLs?: string[];
  setPrevURLs: (urls: string[]) => void;
  values?: File[];
  fieldChange: (files: File[]) => void;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [error, setError] = useState("");
  const count = prevURLs.length + values.length;
  const select = (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    event.target.value = "";
    if (!files.length) return;
    const invalid = files.map(profileImageError).find(Boolean);
    if (invalid) {
      setError(invalid);
      return;
    }
    if (count + files.length > 3) {
      setError("You can add up to 3 featured photos.");
      return;
    }
    setError("");
    fieldChange([...values, ...files]);
  };
  return (
    <div className="flex w-full flex-col gap-2">
      <p className="shad-auth_form_label">Featured Photos</p>
      <input
        type="file"
        ref={input}
        hidden
        aria-label="Choose featured photo"
        accept="image/jpeg,image/png,image/webp"
        onChange={select}
      />
      <div className="flex flex-wrap !gap-4">
        {prevURLs.map((url, index) => (
          <MyPhotosImgCard
            key={url + index}
            src={url}
            alt={"featured photo " + (index + 1)}
            onClick={() => {
              setPrevURLs(prevURLs.filter((_, i) => i !== index));
              setError("");
            }}
          />
        ))}
        {values.map((file, index) => (
          <SelectedPhoto
            key={file.name + file.lastModified + index}
            file={file}
            onDelete={() => {
              fieldChange(values.filter((_, i) => i !== index));
              setError("");
            }}
          />
        ))}
        {Array.from({ length: Math.max(0, 3 - count) }, (_, index) => (
          <button
            key={index}
            type="button"
            aria-label={"Add featured photo " + (count + index + 1)}
            onClick={() => input.current?.click()}
            className="flex-center !size-32 cursor-pointer flex-col gap-2 rounded-md bg-dark-300 text-sm text-light-500"
          >
            <BiPlus className="text-xl" />
            <span>Add Photo</span>
          </button>
        ))}
      </div>
      {error ? (
        <p role="alert" className="text-sm text-red-700 dark:text-red-300">
          {error}
        </p>
      ) : null}
      <p className="text-[13px] text-light-600">
        Add photos of yourself to showcase your work.
      </p>
      <p className="-mt-2 text-[13px] text-light-600">
        You can add up to 3 photos in JPEG, PNG, or WEBP format. Maximum 8 MB
        each.
      </p>
    </div>
  );
}
