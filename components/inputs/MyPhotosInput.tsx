"use client";

import React, { useRef, ChangeEvent } from "react";
import Image from "next/image";
import { useImageSelection } from "@/lib/hooks/useMedia";
import { BiPlus } from "react-icons/bi";
import { MdDelete } from "react-icons/md";

export const MyPhotosImgCard = ({ onClick, src, alt }: any) => {
  return (
    <div className="relative size-28 rounded-md">
      <div
        onClick={onClick}
        className="flex-center hover:myphotos-gradient absolute left-0 top-0 size-full cursor-pointer rounded-md text-white opacity-0 transition-opacity duration-500 hover:z-10 hover:opacity-100"
      >
        <MdDelete className="text-2xl" />
      </div>
      <Image
        src={src}
        alt={alt}
        width={512}
        height={512}
        className="size-28 rounded-md object-cover"
      />
    </div>
  );
};

const MyPhotosInput = ({ prevURLs, setPrevURLs, values, fieldChange }: any) => {
  const myPhotoRefs = useRef<(HTMLInputElement | null)[]>([]); // Store refs as an array
  const { handleImageInput, error } = useImageSelection();

  const handleInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    handleImageInput(event);
    console.log(error);
    if (!event.target.files) return; // Exit if no files are selected

    // Convert FileList to array
    const newFiles = Array.from(event.target.files);
    // Merge new files with existing ones
    const updatedFiles = [...(values || []), ...newFiles];

    if (!error) {
      // Update field with merged files
      fieldChange(updatedFiles);
    }
  };

  const handleInputDelete = (index: number, fileType: string) => {
    if (fileType === "url") {
      const updatedUrls = [...prevURLs];
      updatedUrls.splice(index, 1);
      setPrevURLs(updatedUrls);
    } else {
      const updatedFiles = [...values];
      updatedFiles.splice(index, 1);
      fieldChange(updatedFiles);
    }
  };

  // Ensure refs array length matches inputs
  const ensureRefsArrayLength = (length: number) => {
    while (myPhotoRefs.current.length < length) {
      myPhotoRefs.current.push(null);
    }
  };

  // Ensure refs match the required number of inputs
  const inputCount = 3 - (prevURLs?.length + values?.length);
  ensureRefsArrayLength(inputCount);

  return (
    <div className="flex gap-4">
      {/* displaying singed url values */}
      {prevURLs?.map((url: string, index: number) => (
        <MyPhotosImgCard
          key={index}
          src={url}
          alt={`Image ${index}`}
          onClick={() => handleInputDelete(index, "url")}
        />
      ))}

      {/* displaying selected image files */}
      {values.map((img: any, index: number) => (
        <MyPhotosImgCard
          key={index}
          src={URL.createObjectURL(img)}
          alt={`Image ${index}`}
          onClick={() => handleInputDelete(index, "file")}
        />
      ))}

      {/* input fields based on the number of empty slots */}
      {Array.from({ length: inputCount }).map((_, index) => (
        <React.Fragment key={index}>
          <input
            type="file"
            ref={(el) => {
              myPhotoRefs.current[index] = el; // Assign ref without returning
            }}
            hidden
            onChange={handleInputChange}
            accept="image/jpeg,image/png,image/webp"
          />
          <div
            onClick={() => myPhotoRefs.current[index]?.click()}
            className="flex-center size-28 cursor-pointer flex-col gap-2 rounded-md bg-dark-300 text-sm text-light-500"
          >
            <BiPlus className="text-xl" />
            <p>Add Photo</p>
          </div>
        </React.Fragment>
      ))}
    </div>
  );
};

export default MyPhotosInput;
