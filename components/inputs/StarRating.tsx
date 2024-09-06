"use client";

import { StarIcon } from "@/public/assets/svgs";
import { useState } from "react";

type Props = {
  prevRatingValue: number;
  ratingFor: "PROFILE" | "POST" | "SHARE";
};

const StarRating = ({ prevRatingValue, ratingFor }: Props) => {
  const [rating, setRating] = useState(prevRatingValue);
  const [hover, setHover] = useState(0); // Store the hovered rating

  const handleStarRating = (val: number) => {
    setRating(val); // Set the selected rating
  };

  return (
    <div className="flex items-center gap-2">
      {[...Array(5)].map((star, i) => {
        const ratingValue = i + 1;
        return (
          <div
            key={i}
            onMouseEnter={() => setHover(ratingValue)}
            onMouseLeave={() => setHover(0)}
            onClick={() => handleStarRating(ratingValue)} // Set rating on click
            className={`${
              ratingValue <= rating ? "fill-custom-100" : "fill-light-500"
            }
            ${ratingValue <= hover ? "fill-custom-100" : "fill-light-500"}
              cursor-pointer`}
          >
            <input
              type="radio"
              name="rating"
              value={rating}
              onClick={() => handleStarRating(ratingValue)}
              className="hidden"
            />
            <span
              className={`${
                ratingValue <= rating ? "fill-custom-100" : "fill-light-500"
              } ${ratingValue <= hover && "fill-custom-100"}
              `}
            >
              <StarIcon width="16px" />
            </span>
          </div>
        );
      })}
    </div>
  );
};

export default StarRating;
