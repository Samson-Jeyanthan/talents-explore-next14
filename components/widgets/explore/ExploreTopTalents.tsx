"use client";

import { ExploreTopTalentsCard } from "@/components/cards";
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
              <div key={index} className="exp-embla-slide">
                <ExploreTopTalentsCard
                  profileImage={item.profileImage}
                  userName={item.userName}
                  professional={item.professional}
                  avgRating={item.avgRating}
                  _id={item._id}
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
