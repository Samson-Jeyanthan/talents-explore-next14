"use client";

import React from "react";
import "@/styles/topPostsCarousel.css";
import useEmblaCarousel from "embla-carousel-react";
import { EmblaOptionsType } from "embla-carousel";
import {
  PrevButton,
  NextButton,
  usePrevNextButtons,
} from "./EmblaCarouselArrowButtons";
import { TopPostCard } from "@/components/cards";
import { ITopPost } from "@/types/profile.types";

type PropType = {
  slides: ITopPost[];
  options?: EmblaOptionsType;
  length: number;
};

const TopPostsCarousel = ({ slides, options, length }: PropType) => {
  const [emblaRef, emblaApi] = useEmblaCarousel(options);

  const {
    prevBtnDisabled,
    nextBtnDisabled,
    onPrevButtonClick,
    onNextButtonClick,
  } = usePrevNextButtons(emblaApi);

  return (
    <section className={`${length === 2 ? "embla__two" : "embla"}`}>
      <div className="embla__viewport" ref={emblaRef}>
        <div className="embla__container">
          {slides.map((item, index) => (
            <div className="embla__slide" key={index}>
              <TopPostCard userTopPostCard={item} index={index} />
            </div>
          ))}
        </div>
      </div>

      {length > 1 && (
        <div className="embla__controls">
          <div className="embla__buttons">
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
      )}
    </section>
  );
};

export default TopPostsCarousel;
