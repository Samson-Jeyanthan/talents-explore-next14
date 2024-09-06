"use client";

import { useUserContext } from "@/context/AuthProvider";
import { handleAddRating } from "@/lib/functions/connect.functions";
import { StarIcon } from "@/public/assets/svgs";
import { useState } from "react";
import { toast } from "sonner";

type Props = {
  prevRatingValue: number;
  ratingFor: "PROFILE" | "POST" | "SHARE";
  authorId: string;
  postId?: string;
};

const StarRating = ({
  prevRatingValue,
  ratingFor,
  authorId,
  postId,
}: Props) => {
  const { user } = useUserContext();
  const [rating, setRating] = useState(prevRatingValue);
  const [hover, setHover] = useState(0); // Store the hovered rating

  const handleStarSubmit = (val: number) => {
    setRating(val);
    if (prevRatingValue === val)
      return toast.info("You have already rated", { duration: 4000 });
    if (ratingFor === "POST") {
      handleAddRating(
        user.currentUserId,
        postId,
        authorId,
        ratingFor,
        val,
        `/post/${postId}`
      );
    }
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
            onClick={() => handleStarSubmit(ratingValue)} // Set rating on click
            className="cursor-pointer"
          >
            <input
              type="radio"
              name="rating"
              value={rating}
              // onClick={() => handleStarSubmit(ratingValue)}
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
