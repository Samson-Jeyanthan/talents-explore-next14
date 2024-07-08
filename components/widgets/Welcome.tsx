"use client";

import { Spotlight } from "../ui/Spotlight";
import Image from "next/image";
import { motion as m } from "framer-motion";

const Welcome = () => {
  const spotlightColor = "rgba(255,255,255,0.3)";
  return (
    <>
      <div className="absolute left-0 top-0 h-full w-1/2 rotate-[10deg]">
        <Spotlight className="left-0 h-4/6 w-[10%]" fill={spotlightColor} />
        <Spotlight
          className="left-1/4 h-4/6 w-[10%] rotate-45"
          fill={spotlightColor}
        />
        <Spotlight className="left-[55%] h-4/6 w-[10%]" fill={spotlightColor} />
      </div>
      <div className="absolute right-2 top-14 size-full rotate-[-5deg] -scale-x-100">
        <Spotlight
          className="right-[17%] h-4/6 w-[10%]"
          fill={spotlightColor}
        />
        <Spotlight
          className="right-[2%] top-5 h-4/6 w-[10%] rotate-45"
          fill={spotlightColor}
        />
        <Spotlight
          className="right-[-10%] h-4/6 w-[10%]"
          fill={spotlightColor}
        />
      </div>

      <m.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1, ease: "easeInOut" }}
        className="flex-center mb-16 flex-col gap-5"
      >
        <Image
          src="/assets/images/te-logo-expanded-light.png"
          alt="onboardingImg"
          width={512}
          height={512}
          className="h-auto w-[70%] object-contain"
        />
        <p className="text-base text-light-900">
          Discover, connect, and grow your talent with our vibrant community
        </p>
      </m.div>
    </>
  );
};

export default Welcome;
