"use client";

import { useCallback, useState, useRef, useEffect } from "react";
import {
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";
import { TCropImgModalProps } from "@/types/utils.types";
import Cropper from "react-easy-crop";
import { IoMdClose } from "react-icons/io";
import { Slider } from "@/components/ui/slider";
import { Button } from "../ui/button";
import { FaMinus, FaPlus } from "react-icons/fa";
import getCroppedImg from "@/lib/utils/getCroppedImg";
import { RatioOptions } from "@/constants";

const CropImg = ({
  modalFor,
  media,
  handleCropComplete,
  handleRatioChange,
  setIsRatio,
  isRatio,
  isValues,
}: TCropImgModalProps) => {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const busy = useRef(false);
  const active = useRef(true);
  useEffect(() => {
    active.current = true;
    return () => {
      active.current = false;
    };
  }, []);

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
    [],
  );

  // function for cropping the pixels of selected image's area
  const getCroppedImage = useCallback(
    async (show: string) => {
      if (busy.current || !croppedAreaPixels) return;
      busy.current = true;
      setPending(true);
      setError("");
      try {
        const img: any = await getCroppedImg(media, croppedAreaPixels);
        if (!img?.croppedData) throw new Error("Unable to crop this image.");
        if (!active.current) {
          URL.revokeObjectURL(img.croppedPrev);
          return;
        }

        if (show) {
          setZoom(1);
          setCrop({ x: 0, y: 0 });
          handleCropComplete(img);
          // console.log(img, "cropped image---------");
        } else {
          return img;
        }
      } catch (error) {
        if (active.current)
          setError(
            "Unable to crop this image. Try adjusting the crop or choose another image.",
          );
      } finally {
        busy.current = false;
        if (active.current) setPending(false);
      }
    },
    [croppedAreaPixels, handleCropComplete, media],
  );

  return (
    <DialogContent
      className="gap-0 rounded-2xl border-none bg-dark-250 p-0"
      aria-describedby={undefined}
      onEscapeKeyDown={(event) => {
        if (busy.current) event.preventDefault();
      }}
      onInteractOutside={(event) => {
        if (busy.current) event.preventDefault();
      }}
    >
      <DialogHeader className="flex w-full flex-row items-center justify-between p-2 px-4">
        <DialogTitle className="font-medium text-light-900">
          {modalFor === "cover" && "Set Cover Photo"}
          {modalFor === "profile" && "Set Profile Photo"}
          {modalFor === "post" && "Adjust & Crop Photo for Post"}
        </DialogTitle>
        <div className="flex-center relative pb-2">
          <DialogClose
            disabled={pending}
            className="flex-center text-[1.5rem] text-light-900"
          >
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
        {modalFor === "post" && (
          <Cropper
            image={media.preview}
            crop={crop}
            zoom={zoom}
            aspect={
              isRatio.is16to9
                ? 16 / 11
                : isRatio.is4to3
                  ? 4 / 3
                  : isRatio.is3to2
                    ? 3 / 2
                    : isRatio.is1to1
                      ? 1 / 1
                      : isRatio.is3to4
                        ? 3.6 / 4.495
                        : isRatio.is2to3
                          ? 2 / 3
                          : 3.6 / 4.495
            }
            cropShape="rect"
            onCropChange={setCrop}
            onCropComplete={onCropComplete}
            onZoomChange={setZoom}
            showGrid={true}
            maxZoom={4.6}
            minZoom={1}
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
          onValueChange={(value) => setZoom(value[0])}
          className="h-1 bg-dark-400"
        />
        <div
          className="cursor-pointer rounded-[1px] bg-dark-300 p-[3px] text-base text-light-900 hover:bg-dark-400"
          onClick={zoomIn}
        >
          <FaPlus />
        </div>
      </div>

      <div className="flex-center w-full">
        {modalFor === "post" && !isValues && (
          <div className="flex-center my-3 w-max rounded-md bg-dark-300">
            {RatioOptions.map((item: any, index: number) => (
              <div
                key={index}
                onClick={() => handleRatioChange?.(item.num)}
                className={`
                 ${
                   index === 0
                     ? "rounded-l-lg border"
                     : `${
                         index === RatioOptions.length - 1
                           ? "rounded-r-lg border-y border-r"
                           : "border-y border-r"
                       }`
                 }
                     cursor-pointer border-light-850 p-[5px] px-3 text-center text-sm text-light-850 hover:bg-light-850  hover:text-dark-100`}
              >
                {item.text}
              </div>
            ))}
          </div>
        )}
      </div>

      <footer className="flex w-full justify-end p-4">
        {error ? (
          <p
            role="alert"
            className="mr-3 text-sm text-red-700 dark:text-red-300"
          >
            {error}
          </p>
        ) : null}
        <Button
          type="button"
          disabled={pending || !croppedAreaPixels}
          onClick={() => getCroppedImage("show")}
          className="shad-btn_primary-200"
        >
          {pending ? "Cropping..." : "Done"}
        </Button>
      </footer>
    </DialogContent>
  );
};

export default CropImg;
