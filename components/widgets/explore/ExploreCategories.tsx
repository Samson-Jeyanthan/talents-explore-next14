"use client";

import "@/styles/exploreCarousel.css";
import { RenderTag } from "@/components/others";
import { EmblaOptionsType } from "embla-carousel";
import useEmblaCarousel from "embla-carousel-react";
import { usePrevNextButtons } from "../carousels/EmblaCarouselArrowButtons";

type Props = {
  data: any[];
  options?: EmblaOptionsType;
};

const ExploreCategories = ({ data, options }: Props) => {
  const [emblaRef, emblaApi] = useEmblaCarousel(options);
  const {
    prevBtnDisabled,
    nextBtnDisabled,
    onPrevButtonClick,
    onNextButtonClick,
  } = usePrevNextButtons(emblaApi);

  return (
    <div className="flex flex-col justify-start gap-3">
      <h3 className="text-lg font-semibold text-light-800">Categories</h3>
      <div className="exc-embla">
        <div className="exc-embla__viewport" ref={emblaRef}>
          <div className="exc-embla__container">
            {data.map((item, index) => (
              <div className="exc-embla__slide" key={index}>
                <RenderTag Icon="" name={item.name} _id={item._id} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExploreCategories;
