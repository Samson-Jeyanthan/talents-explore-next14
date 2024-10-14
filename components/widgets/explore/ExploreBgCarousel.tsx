import Image from "next/image";
import React from "react";

const ExploreBgCarousel = () => {
  return (
    <div className="absolute left-0 top-0 z-0 size-full">
      <Image
        src="/assets/images/explore-cover.jpg"
        alt="explore-cover"
        fill
        className="size-full bg-dark-200 object-cover"
      />
    </div>
  );
};

export default ExploreBgCarousel;
