"use client";

import { useUtils } from "@/context/UtilsProvider";
import { TPostProps } from "@/types/post.types";
import Image from "next/image";

type Props = {
  postData: TPostProps;
};

const BlurredMedia = ({ postData }: Props) => {
  const { mdSelectedMediaIndex } = useUtils();
  return (
    <Image
      src={
        postData.media[mdSelectedMediaIndex]?.url
          ? postData?.media[mdSelectedMediaIndex]?.url
          : ""
      }
      width={200}
      height={200}
      className="absolute top-0 z-0 h-[30rem] w-4/5 translate-x-1/2 translate-y-1/2 object-cover opacity-30 lg:w-[30rem]"
      alt="blur-media-img"
    />
  );
};

export default BlurredMedia;
