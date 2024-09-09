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
      className="absolute top-0 z-0 size-[40rem] translate-x-1/4 translate-y-1/3 object-cover opacity-30"
      alt="blur-media-img"
    />
  );
};

export default BlurredMedia;
