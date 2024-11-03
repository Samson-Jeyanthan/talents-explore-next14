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

type Props = {
  slides: any[];
  options?: EmblaOptionsType;
  length: number;
};
const PostFeedCarousel = ({ slides, options, length }: Props) => {
  const [emblaRef, emblaApi] = useEmblaCarousel(options);

  const { selectedIndex } = useDotButton(emblaApi);

  const {
    prevBtnDisabled,
    nextBtnDisabled,
    onPrevButtonClick,
    onNextButtonClick,
  } = usePrevNextButtons(emblaApi);

  return (
    <section className="pf-embla">
      <div className="pf-embla__viewport" ref={emblaRef}>
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
                  />
                ) : (
                  <Image
                    src={item.url}
                    key={index}
                    width={500}
                    height={500}
                    alt="post"
                    className="max-h-[30rem] w-full rounded-xl bg-dark-200 object-contain"
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>

      <footer className="flex-center w-full">
        <div className="pf-embla__controls">
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
    </section>
  );
};

export default PostFeedCarousel;
