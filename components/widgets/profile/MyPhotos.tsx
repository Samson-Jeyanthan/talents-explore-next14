"use client";

import { CameraIcon } from "@/public/assets/svgs";
import Image from "next/image";

interface MyPhotosProps {
  myPhotos: string[];
}

const MyPhotos = ({ myPhotos }: MyPhotosProps) => {
  return (
    <section className="flex flex-col gap-2">
      <div className="profile-detail-heading">
        <CameraIcon width="21px" height="21px" /> My Photos
      </div>
      <div className="flex items-center gap-2">
        {myPhotos?.map((photo, index) => (
          <Image
            key={index}
            src={photo}
            alt="my photo"
            width={1024}
            height={1024}
            className="size-28 rounded-xl object-cover"
          />
        ))}
      </div>
    </section>
  );
};

export default MyPhotos;
