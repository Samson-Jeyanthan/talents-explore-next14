"use client";

import { useCallback, useState } from "react";
import {
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogOverlay,
  DialogClose,
} from "@/components/ui/dialog";
import { TCropImgModalProps } from "@/types/utils.types";
import Cropper from "react-easy-crop";
import { IoMdClose } from "react-icons/io";
import { Slider } from "@/components/ui/slider";
import { Button } from "../ui/button";
import { FaMinus, FaPlus } from "react-icons/fa";
import getCroppedImg from "@/lib/utils/getCroppedImg";

const CropImg = ({
  modalFor,
  media,
  handleCropComplete,
}: TCropImgModalProps) => {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);

  const zoomOut = () => {
    const decrease = zoom - 0.5;
    if (decrease > 0) {
      setZoom(decrease);
    }
  };

  const zoomIn = () => {
    const increase = zoom + 0.5;
    if (increase < 11) {
      setZoom(increase);
    }
  };

  // selecting the area pixels to be crop
  const onCropComplete = useCallback(
    (croppedArea: any, croppedAreaPixels: any) => {
      setCroppedAreaPixels(croppedAreaPixels);
    },
    []
  );

  // function for cropping the pixels of selected image's area
  const getCroppedImage = useCallback(
    async (show: string) => {
      try {
        const img = await getCroppedImg(media, croppedAreaPixels);

        if (show) {
          setZoom(1);
          setCrop({ x: 0, y: 0 });
          handleCropComplete(img);
          console.log(img, "cropped image---------");
        } else {
          return img;
        }
      } catch (error) {
        console.log(error);
      }
    },
    [croppedAreaPixels, handleCropComplete, media]
  );

  return (
    <>
      <DialogOverlay />
      <DialogContent
        className="gap-0 rounded-2xl border-none bg-dark-250 p-0"
        aria-describedby={undefined}
      >
        <DialogHeader className="flex w-full flex-row items-center justify-between p-2 px-4">
          <DialogTitle className="font-medium text-light-900">
            {modalFor === "cover" && "Set Cover Photo"}
            {modalFor === "profile" && "Set Profile Photo"}
            {modalFor === "post" && "Adjust & Crop Photo for Post"}
          </DialogTitle>
          <div className="flex-center relative pb-2">
            <DialogClose className="flex-center text-[1.5rem] text-light-900">
              <IoMdClose />
            </DialogClose>
          </div>
        </DialogHeader>

        <div className="flex-center relative m-4 mt-0 h-[350px] w-[94%] border-none 2xl:h-[400px]">
          {modalFor === "cover" && (
            <Cropper
              image={media.preview}
              crop={crop}
              zoom={zoom}
              aspect={6.8 / 2}
              onCropChange={setCrop}
              onZoomChange={setZoom}
              onCropComplete={onCropComplete}
              onMediaLoaded={(res: any) => {
                console.log(res);
              }}
            />
          )}
          {modalFor === "profile" && (
            <Cropper
              image={media.preview}
              crop={crop}
              zoom={zoom}
              cropShape="round"
              aspect={1}
              onCropChange={setCrop}
              onZoomChange={setZoom}
              onCropComplete={onCropComplete}
              onMediaLoaded={(res: any) => {
                console.log(res);
              }}
            />
          )}
        </div>
        <div className="flex-center w-full gap-2 p-4 pt-2">
          <div
            className="cursor-pointer rounded-[1px] bg-dark-300 p-[3px] text-base text-light-900 hover:bg-dark-400"
            onClick={zoomOut}
          >
            <FaMinus />
          </div>
          <Slider
            defaultValue={[2]}
            min={1}
            max={10}
            step={0.1}
            value={[zoom]}
            onValueChange={(e: any) => setZoom(e)}
            className="h-1 bg-dark-400"
          />
          <div
            className="cursor-pointer rounded-[1px] bg-dark-300 p-[3px] text-base text-light-900 hover:bg-dark-400"
            onClick={zoomIn}
          >
            <FaPlus />
          </div>
        </div>
        <footer className="flex w-full justify-end p-4">
          <Button
            onClick={() => getCroppedImage("show")}
            className="shad-btn_primary-200"
          >
            Done
          </Button>
        </footer>
      </DialogContent>
    </>
  );
};

export default CropImg;
