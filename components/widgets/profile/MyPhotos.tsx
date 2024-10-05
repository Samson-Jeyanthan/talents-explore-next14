"use client";

import { PhotoViewModal } from "@/components/modals";
import { Dialog } from "@/components/ui/dialog";
import { CameraIcon } from "@/public/assets/svgs";
import Image from "next/image";
import React, { useState } from "react";

interface MyPhotosProps {
  myPhotos: string[];
}

const MyPhotos = ({ myPhotos }: MyPhotosProps) => {
  const [selectedImg, setSelectedImg] = useState<string>("");

  const handleSelectImg = (url: string) => {
    setSelectedImg(url);
  };

  return (
    <section className="flex flex-col gap-2">
      <div className="profile-detail-heading mb-3">
        <CameraIcon width="21px" height="21px" /> My Photos
      </div>
      <div className="flex items-start gap-2">
        {myPhotos[0] && (
          <Image
            src={myPhotos[0]}
            alt="my photo"
            width={1024}
            height={1024}
            className="size-36 min-w-36 cursor-pointer rounded-xl object-cover 2xl:size-[12.5rem] 2xl:min-w-[12.5rem]"
            onClick={() => handleSelectImg(myPhotos[0])}
          />
        )}

        <div className="flex flex-col gap-2">
          {myPhotos?.map((photo, index) => {
            if (!photo) return null;
            return (
              <React.Fragment key={index}>
                {index !== 0 && (
                  <Image
                    src={photo}
                    alt="my photo"
                    width={1024}
                    height={1024}
                    className="size-24 min-w-24 cursor-pointer rounded-xl object-cover"
                    onClick={() => handleSelectImg(photo)}
                  />
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      <Dialog open={Boolean(selectedImg)}>
        <PhotoViewModal
          imgURL={selectedImg}
          onClick={() => setSelectedImg("")}
        />
      </Dialog>
    </section>
  );
};

export default MyPhotos;
