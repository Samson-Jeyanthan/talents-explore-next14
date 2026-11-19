"use client";

import { DialogClose, DialogContent, DialogTitle } from "../ui/dialog";
import Image from "next/image";
import { MinScreenIcon } from "@/public/assets/svgs";

type Props = {
  mediaType: "image" | "video";
  mediaUrl: string | any;
  onClose: () => void;
};

const FullScreenModal = ({ mediaType, mediaUrl, onClose }: Props) => {
  return (
    <DialogContent
      className="h-screen max-h-full w-screen max-w-full border-none p-0"
      aria-describedby={undefined}
    >
      <DialogTitle className="sr-only">Media preview</DialogTitle>
      {mediaType === "video" ? (
        <video
          src={mediaUrl}
          controls
          playsInline
          preload="metadata"
          className="h-screen w-full bg-dark-100 object-contain"
        />
      ) : (
        <Image
          src={mediaUrl}
          width={1024}
          height={1024}
          alt="image"
          className="h-screen w-full bg-dark-100 object-contain"
        />
      )}
      <DialogClose
        onClick={onClose}
        className="flex-center fixed bottom-3 right-3 size-[34px] cursor-pointer rounded-full bg-dark-200 fill-light-900 pt-[2px]"
      >
        <MinScreenIcon width={"17px"} height={"17px"} />
      </DialogClose>
    </DialogContent>
  );
};

export default FullScreenModal;
