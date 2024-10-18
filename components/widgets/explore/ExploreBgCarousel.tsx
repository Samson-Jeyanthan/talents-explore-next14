"use client";

import React, { useEffect, useState } from "react";
import { EXPLORE_BG_IMAGES } from "@/constants";
import Image from "next/image";

function ExploreBgCarousel({ slides }: { slides: string[] }) {
  const autoSlideInterval = 6000;
  const [currentIndex, setCurrentIndex] = useState(0);

  const next = () => {
    setCurrentIndex((currentIndex) =>
      currentIndex === EXPLORE_BG_IMAGES.length - 1 ? 0 : currentIndex + 1
    );
  };

  useEffect(() => {
    const slideInterval = setInterval(next, autoSlideInterval);
    return () => clearInterval(slideInterval);
  }, []);

  return (
    <div className="absolute left-0 top-0 z-0 flex w-full overflow-hidden">
      <div
        className="flex w-full transition-transform duration-500 ease-out"
        style={{ transform: `translateX(-${currentIndex * 100}%)` }}
      >
        {slides.map((img, index) => (
          <div key={index} className="h-[26rem] w-full border-red-400">
            <Image
              src={img}
              alt="explore-cover"
              width={1024}
              height={1024}
              className="size-full min-w-[100vw] bg-dark-200 !object-cover"
            />
          </div>
        ))}
      </div>
    </div>
  );
}

export default ExploreBgCarousel;
