"use client";

import "@/styles/postFeedCarousel.css";
import useEmblaCarousel from "embla-carousel-react";
import { EmblaOptionsType } from "embla-carousel";
import { useDotButton } from "./EmblaCarouselDotButton";
import {
  NextButton,
  PrevButton,
  usePrevNextButtons,
} from "./EmblaCarouselArrowButtons";
import Image from "next/image";
import VideoCard from "@/components/video/VideoCard";
import { useEffect, useState } from "react";

type Props = {
  slides: any[];
  options?: EmblaOptionsType;
  length: number;
};
const PostFeedCarousel = ({ slides, options, length }: Props) => {
  const [emblaRef, emblaApi] = useEmblaCarousel(options);
  const [mediaHeight, setMediaHeight] = useState<number>();

  useEffect(() => {
    if (!emblaApi) return;
    const updateHeight = () => {
      const slide = emblaApi.slideNodes()[emblaApi.selectedScrollSnap()];
      const height = slide?.getBoundingClientRect().height;
      if (height && height > 0) setMediaHeight(Math.ceil(height));
    };
    const observer = new ResizeObserver(updateHeight);
    const observeSelectedSlide = () => {
      observer.disconnect();
      const slide = emblaApi.slideNodes()[emblaApi.selectedScrollSnap()];
      if (slide) observer.observe(slide);
      updateHeight();
    };
    observeSelectedSlide();
    emblaApi.on("select", observeSelectedSlide);
    emblaApi.on("reInit", observeSelectedSlide);
    return () => {
      observer.disconnect();
      emblaApi.off("select", observeSelectedSlide);
      emblaApi.off("reInit", observeSelectedSlide);
    };
  }, [emblaApi, slides]);

  const { selectedIndex } = useDotButton(emblaApi);

  const {
    prevBtnDisabled,
    nextBtnDisabled,
    onPrevButtonClick,
    onNextButtonClick,
  } = usePrevNextButtons(emblaApi);

  return (
    <section className="pf-embla">
      <div
        className="pf-embla__viewport"
        ref={emblaRef}
        style={{ height: mediaHeight }}
      >
        <div className="pf-embla__container">
          {slides.map((item, index) => {
            const isVideo = item.mediaType === "video";
            return (
              <div className="pf-embla__slide" key={index}>
                {isVideo ? (
                  <VideoCard
                    key={index}
                    videoUrl={item.url}
                    thumbnailUrl={item.thumbnailUrl}
                    isControl={true}
                    className="block h-auto max-h-[34rem] w-full rounded-xl bg-dark-200 object-contain"
                  />
                ) : (
                  <Image
                    src={item.url}
                    key={index}
                    width={500}
                    height={500}
                    alt="post"
                    className="block h-auto max-h-[34rem] w-full rounded-xl bg-dark-200 object-contain"
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {length > 1 && (
        <footer className="flex-center w-full">
          <div className="mt-2 flex w-[98%] items-center justify-between gap-2">
            <div className="text-sm text-light-500">
              {selectedIndex + 1} / {slides.length}
            </div>
            <div className="pf-embla__buttons">
              <PrevButton
                onClick={onPrevButtonClick}
                disabled={prevBtnDisabled}
              />
              <NextButton
                onClick={onNextButtonClick}
                disabled={nextBtnDisabled}
              />
            </div>
          </div>
        </footer>
      )}
    </section>
  );
};

export default PostFeedCarousel;
