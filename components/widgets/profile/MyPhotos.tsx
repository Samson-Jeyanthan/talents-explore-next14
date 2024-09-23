"use client";

import Image from "next/image";

interface MyPhotosProps {
  myPhotos: string[];
}

const MyPhotos = ({ myPhotos }: MyPhotosProps) => {
  return (
    <section className="">
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
