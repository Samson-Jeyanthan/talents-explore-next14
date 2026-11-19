"use client";

import { defaultMediaState } from "@/lib/hooks/useMedia";
import { Media } from "@/types/utils.types";
import {
  createPostVideoThumbnail,
  validatePostFile,
} from "@/lib/utils/postMedia";
import Image from "next/image";
import React, { ChangeEvent, useEffect, useRef, useState } from "react";
import { IoIosArrowBack, IoIosArrowForward } from "react-icons/io";
import { MdDelete } from "react-icons/md";
import { CropImgModal, ErrorAlert } from "../modals";
import { Dialog } from "../ui/dialog";

const MediaInput = ({ fieldChange, values, onProcessingChange }: any) => {
  const mediaRef = useRef<HTMLInputElement>(null);
  const [isOpen, setIsOpen] = useState(false);
  // const [mediaHeight, setMediaHeight] = useState("auto");
  const [activeIndex, setActiveIndex] = useState(0);
  const [media, setMedia] = useState<Media>(defaultMediaState);
  const [error, setError] = useState("");
  const [checking, setChecking] = useState(false);
  useEffect(() => {
    onProcessingChange?.(checking || isOpen);
    return () => onProcessingChange?.(false);
  }, [checking, isOpen, onProcessingChange]);
  const urls = useRef(new Set<string>());
  const mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    const previewUrls = urls.current;
    return () => {
      mounted.current = false;
      previewUrls.forEach((url) => URL.revokeObjectURL(url));
      previewUrls.clear();
    };
  }, []);
  const trackUrl = (file: Blob) => {
    const url = URL.createObjectURL(file);
    urls.current.add(url);
    return url;
  };
  const releaseUrl = (url: string) => {
    if (urls.current.delete(url)) URL.revokeObjectURL(url);
  };
  const resetMedia = () => {
    if (media.preview) releaseUrl(media.preview);
    setMedia(defaultMediaState);
  };
  const [isRatio, setIsRatio] = useState({
    is16to9: false,
    is4to3: false,
    is3to2: false,
    is1to1: false,
    is3to4: false,
    is2to3: false,
  });

  const handleInputChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file || checking) return;
    if (values.length >= 9) {
      setError("You can add up to 9 media files.");
      return;
    }
    setError("");
    setChecking(true);
    try {
      validatePostFile(file);
      if (file.type.startsWith("video/")) {
        const thumbnail = await createPostVideoThumbnail(file);
        if (!mounted.current) return;
        fieldChange([
          ...values,
          {
            mediaType: "video",
            croppedData: file,
            croppedPrev: trackUrl(file),
            thumbnail,
            thumbnailPreview: trackUrl(thumbnail),
          },
        ]);
        setActiveIndex(values.length);
      } else {
        setMedia({
          data: file,
          preview: trackUrl(file),
          fileName: file.name,
          fileType: file.type,
          mediaType: "image",
        });
        setIsOpen(true);
      }
    } catch (error) {
      if (mounted.current)
        setError(
          error instanceof Error ? error.message : "Unable to read this file.",
        );
    } finally {
      if (mounted.current) setChecking(false);
    }
  };

  // handling invalid media
  const handleOkClick = () => {
    setError("");
    resetMedia();
    setIsOpen(false);
  };

  const handleRatioChange = (ratio: number) => {
    switch (true) {
      case ratio === 169:
        setIsRatio({
          ...isRatio,
          is16to9: true,
          is4to3: false,
          is3to2: false,
          is1to1: false,
          is3to4: false,
          is2to3: false,
        });
        break;
      case ratio === 43:
        setIsRatio({
          ...isRatio,
          is16to9: false,
          is4to3: true,
          is3to2: false,
          is1to1: false,
          is3to4: false,
          is2to3: false,
        });
        break;
      case ratio === 32:
        setIsRatio({
          ...isRatio,
          is16to9: false,
          is4to3: false,
          is3to2: true,
          is1to1: false,
          is3to4: false,
          is2to3: false,
        });
        break;
      case ratio === 11:
        setIsRatio({
          ...isRatio,
          is16to9: false,
          is4to3: false,
          is3to2: false,
          is1to1: true,
          is3to4: false,
          is2to3: false,
        });
        break;
      case ratio === 34:
        setIsRatio({
          ...isRatio,
          is16to9: false,
          is4to3: false,
          is3to2: false,
          is1to1: false,
          is3to4: true,
          is2to3: false,
        });
        break;
      case ratio === 23:
        setIsRatio({
          ...isRatio,
          is16to9: false,
          is4to3: false,
          is3to2: false,
          is1to1: false,
          is3to4: false,
          is2to3: true,
        });
        break;
      default:
        setIsRatio({
          ...isRatio,
          is16to9: false,
          is4to3: true,
          is3to2: false,
          is1to1: false,
          is3to4: false,
          is2to3: false,
        });
        break;
    }
  };

  // image crop compelte function
  const handleCropComplete = (img: any) => {
    if (!img?.croppedData || !img?.croppedPrev) {
      setError("Unable to crop this image.");
      return;
    }
    urls.current.add(img.croppedPrev);
    const currentValues = Array.isArray(values) ? values : [];
    const updatedMedia = [...currentValues, img];

    fieldChange(updatedMedia);
    setActiveIndex(values.length);
    setIsOpen(false);
    resetMedia();
  };

  const handleNextClick = () => {
    setActiveIndex(activeIndex + 1);
  };

  const handlePrevClick = () => {
    setActiveIndex(activeIndex - 1);
  };

  const handleMediaDelete = (itemIndex: number) => {
    if (checking) return;
    releaseUrl(values[itemIndex].croppedPrev);
    if (values[itemIndex].thumbnailPreview)
      releaseUrl(values[itemIndex].thumbnailPreview);
    const updatedValues = values.filter(
      (_: any, index: number) => index !== itemIndex,
    );

    fieldChange(updatedValues);

    setActiveIndex((prevIndex: number) => {
      if (updatedValues.length === 0) return 0;
      if (itemIndex < prevIndex) return prevIndex - 1;
      if (itemIndex === prevIndex) {
        return Math.min(itemIndex, updatedValues.length - 1);
      }
      return prevIndex;
    });
  };

  // useEffect(() => {
  //   const media = values?.[0];

  //   if (!media?.croppedPrev) {
  //     setMediaHeight("auto");
  //     return;
  //   }

  //   const image = new window.Image();

  //   image.src = media.croppedPrev;

  //   image.onload = () => {
  //     if (image.naturalWidth && image.naturalHeight) {
  //       const aspectRatio = image.naturalWidth / image.naturalHeight;
  //       const newHeight = 28 / aspectRatio;

  //       setMediaHeight(`${newHeight}rem`);
  //     }
  //   };

  //   image.onerror = () => {
  //     setMediaHeight("auto");
  //   };

  //   return () => {
  //     image.onload = null;
  //     image.onerror = null;
  //   };
  // }, [values]);

  return (
    <section className="sticky top-[5.5rem] flex min-h-[32rem] w-[28rem] flex-col items-center gap-4">
      <input
        ref={mediaRef}
        type="file"
        disabled={checking}
        onChange={handleInputChange}
        accept="image/jpeg, image/png, image/webp, video/mp4, video/quicktime, video/*"
        hidden
      />
      {values.length > 0 ? (
        <div className="relative size-full">
          {values.map((media: any, index: any) => (
            <React.Fragment key={index}>
              {activeIndex === index && (
                <>
                  <button
                    type="button"
                    aria-label="Remove selected media"
                    disabled={checking}
                    className="media-prev-btn absolute left-2 top-2 z-10 cursor-pointer"
                    onClick={() => handleMediaDelete(index)}
                  >
                    <MdDelete />
                  </button>
                  {media.mediaType === "video" ? (
                    <video
                      key={media.croppedPrev}
                      src={media.croppedPrev}
                      poster={media.thumbnailPreview}
                      controls
                      preload="metadata"
                      className="max-h-[32rem] w-full rounded-xl"
                    />
                  ) : (
                    <Image
                      src={media.croppedPrev}
                      height={1000}
                      alt="img"
                      width={1000}
                      className="size-full rounded-xl object-cover"
                    />
                  )}
                </>
              )}
            </React.Fragment>
          ))}
          <div className="flex-end absolute bottom-2 w-full gap-2 pr-2">
            {activeIndex > 0 && (
              <span onClick={handlePrevClick} className="media-prev-btn">
                <IoIosArrowBack />
              </span>
            )}
            {activeIndex < values.length - 1 && (
              <span onClick={handleNextClick} className="media-prev-btn">
                <IoIosArrowForward />
              </span>
            )}
          </div>
        </div>
      ) : (
        <div
          className="flex size-[28rem] cursor-pointer flex-col items-center justify-center gap-4 rounded-lg border border-solid border-dark-400 text-sm text-light-500"
          onClick={() => mediaRef.current?.click()}
        >
          <Image
            src="/assets/images/upload-img.png"
            alt="upload-img"
            width={500}
            height={500}
            className="h-auto w-20"
          />
          Click here to upload a file
        </div>
      )}

      <p role="status" className="text-sm text-light-500">
        {checking
          ? "Checking video and generating preview..."
          : "Up to 9 images or videos. Each file: 1 GB maximum. Videos: 10 minutes maximum."}
      </p>

      <ErrorAlert
        isOpen={Boolean(error)}
        title="OOPS! Something went wrong"
        error={error}
        onClick={handleOkClick}
      />

      {values.length > 0 && (
        <div className="flex w-full flex-wrap items-start gap-4 py-1">
          {values.map((media: any, index: number) => (
            <div
              className="relative size-[4.5rem] cursor-pointer before:absolute before:inset-0 before:z-[2] before:rounded-[5px] before:content-[''] hover:z-10 hover:bg-black/50"
              key={index}
              onClick={() => setActiveIndex(index)}
            >
              <Image
                className="relative z-[1] size-full rounded-lg object-cover"
                src={media.thumbnailPreview || media.croppedPrev}
                alt={`Image ${index}`}
                width={500}
                height={500}
              />
            </div>
          ))}
          {values.length < 9 && (
            <div
              className="flex-center size-[4.5rem] cursor-pointer flex-col gap-0 rounded-lg border border-solid border-dark-400 bg-dark-300 text-xs text-custom-100"
              onClick={() => mediaRef.current?.click()}
            >
              <p className="text-lg">+</p>
              Add
            </div>
          )}
        </div>
      )}

      <Dialog
        open={isOpen && media && !error}
        onOpenChange={() => {
          setIsOpen(false);
          resetMedia();
        }}
      >
        <CropImgModal
          modalFor="post"
          media={media}
          handleCropComplete={handleCropComplete}
          handleRatioChange={handleRatioChange}
          setIsRatio={setIsRatio}
          isRatio={isRatio}
          isValues={values.length > 0}
        />
      </Dialog>
    </section>
  );
};

export default MediaInput;
