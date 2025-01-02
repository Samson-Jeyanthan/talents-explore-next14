"use client";

import "@/styles/exploreCarousel.css";
import { RenderTag } from "@/components/others";
import { EmblaOptionsType } from "embla-carousel";
import useEmblaCarousel from "embla-carousel-react";
import { getCategoryDetails } from "@/lib/utils/ReactElementUtils";
import { IMainCategoryProps } from "@/types/utils.types";

type Props = {
  data: IMainCategoryProps[];
  options?: EmblaOptionsType;
};

const ExploreCategories = ({ data, options }: Props) => {
  const [emblaRef] = useEmblaCarousel(options);

  return (
    <div className="flex flex-col justify-start gap-3">
      <h3 className="text-lg font-semibold text-light-800">
        Explore By Categories
      </h3>
      <div className="exp-embla prevent-select">
        <div className="embla__viewport" ref={emblaRef}>
          <div className="exp-container">
            {data.map((item, index) => {
              const detail = getCategoryDetails(item.name);
              return (
                <div className="exp-embla-slide" key={index}>
                  <RenderTag
                    Icon={detail.icon}
                    name={item.name}
                    _id={item._id}
                    showIcon={true}
                  />
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExploreCategories;
