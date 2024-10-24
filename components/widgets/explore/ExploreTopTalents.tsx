"use client";

import { ExploreTopTalentsCard } from "@/components/cards";
import { ITopTalentsProps } from "@/types/utils.types";
import { EmblaOptionsType } from "embla-carousel";
import useEmblaCarousel from "embla-carousel-react";
import { usePrevNextButtons } from "../carousels/EmblaCarouselArrowButtons";

type Props = {
  data: ITopTalentsProps[];
  options?: EmblaOptionsType;
};

const ExploreTopTalents = ({ data, options }: Props) => {
  const [emblaRef, emblaApi] = useEmblaCarousel(options);
  const {
    prevBtnDisabled,
    nextBtnDisabled,
    onPrevButtonClick,
    onNextButtonClick,
  } = usePrevNextButtons(emblaApi);

  return (
    <div className="flex flex-col justify-start gap-3">
      <h3 className="text-lg font-semibold text-light-800">
        Explore Top Talents
      </h3>

      <div className="expt-embla prevent-select">
        <div className="embla__viewport" ref={emblaRef}>
          <div className="expt-embla__container">
            {data.map((item, index) => (
              <div key={index} className="expt-embla__slide">
                <ExploreTopTalentsCard
                  src={item.profileImage}
                  userName={item.userName}
                  profession={item.professional}
                  avgRating={item.avgRating}
                  userId={item._id}
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExploreTopTalents;
