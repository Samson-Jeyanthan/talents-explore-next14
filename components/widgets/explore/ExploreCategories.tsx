"use client";

import "@/styles/exploreCarousel.css";
import { RenderTag } from "@/components/others";
import { EmblaOptionsType } from "embla-carousel";
import useEmblaCarousel from "embla-carousel-react";
import { usePrevNextButtons } from "../carousels/EmblaCarouselArrowButtons";
import {
  AnimationFillIcon,
  CameraFillIcon,
  CommandFillIcon,
  DanceFillIcon,
  FilmFillIcon,
  GraphicsFillIcon,
  HeadPhoneFillIcon,
  PaintFillIcon,
} from "@/public/assets/svgs";

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

  const getCategoriesIcon = (name: string) => {
    switch (name) {
      case "Sports & Fitness":
        return HeadPhoneFillIcon;
      case "Songs & Music":
        return HeadPhoneFillIcon;
      case "Dance & Styles":
        return DanceFillIcon;
      case "Arts & Crafts":
        return PaintFillIcon;
      case "Graphics & Designs":
        return GraphicsFillIcon;
      case "Programming & Tech":
        return CommandFillIcon;
      case "Video & Animation":
        return AnimationFillIcon;
      case "UX, Writing & Translation":
        return HeadPhoneFillIcon;
      case "Photography":
        return CameraFillIcon;
      case "Film & Entertainment":
        return FilmFillIcon;
      default:
        return HeadPhoneFillIcon;
    }
  };

  return (
    <div className="flex flex-col justify-start gap-3">
      <h3 className="text-lg font-semibold text-light-800">
        Explore By Categories
      </h3>
      <div className="exc-embla prevent-select">
        <div className="embla__viewport" ref={emblaRef}>
          <div className="exc-embla__container">
            {data.map((item, index) => (
              <div className="exc-embla__slide" key={index}>
                <RenderTag
                  Icon={getCategoriesIcon(item.name)}
                  name={item.name}
                  _id={item._id}
                  showIcon={true}
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExploreCategories;
