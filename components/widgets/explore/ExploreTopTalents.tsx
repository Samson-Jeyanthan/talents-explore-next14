"use client";

import AllTalentsCard from "@/components/cards/AllTalentsCard";
import { IExploreTalentsProps } from "@/types/utils.types";
import { EmblaOptionsType } from "embla-carousel";
import useEmblaCarousel from "embla-carousel-react";
// import { usePrevNextButtons } from "../carousels/EmblaCarouselArrowButtons";
import Link from "next/link";
import { IoIosArrowForward } from "react-icons/io";

type Props = {
  data: IExploreTalentsProps[];
  options?: EmblaOptionsType;
};

const ExploreTopTalents = ({ data, options }: Props) => {
  const [emblaRef] = useEmblaCarousel(options);
  // const {
  //   prevBtnDisabled,
  //   nextBtnDisabled,
  //   onPrevButtonClick,
  //   onNextButtonClick,
  // } = usePrevNextButtons(emblaApi);

  return (
    <div className="flex flex-col justify-start gap-3">
      <h3 className="flex-between text-lg font-semibold text-light-800">
        Explore Top Talents
        <Link
          href="/explore/talents"
          className="flex-center gap-2 text-xs font-light text-custom-lightBlue hover:text-light-900"
        >
          See all <IoIosArrowForward />
        </Link>
      </h3>

      <div className="exp-embla prevent-select">
        <div className="embla__viewport" ref={emblaRef}>
          <div className="exp-container">
            {data.map((item, index) => (
              <div key={item._id} className="exp-embla-slide w-56">
                <AllTalentsCard allTalentsCard={item} index={index} />
              </div>
            ))}
          </div>
        </div>
      </div>
      {!data.length && (
        <p className="text-sm text-light-500">No top talents available yet.</p>
      )}
    </div>
  );
};

export default ExploreTopTalents;
