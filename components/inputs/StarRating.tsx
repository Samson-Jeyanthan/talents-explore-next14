"use client";

import { useUserContext } from "@/context/AuthProvider";
import { StarIcon } from "@/public/assets/svgs";
import { useEffect, useId, useState } from "react";
import { useRating, type RatingMode } from "@/lib/hooks/useRating";
import { useRouter } from "next/navigation";

type Props = {
  prevRatingValue: number;
  ratingFor: RatingMode;
  authorId: string;
  postId?: string;
  revalidatePath: string;
  onChange?: (val: number) => void;
};
export default function StarRating({
  prevRatingValue,
  ratingFor,
  authorId,
  postId,
  revalidatePath,
  onChange,
}: Props) {
  const { user } = useUserContext();
  const router = useRouter();
  const name = useId();
  const [hover, setHover] = useState(0);
  const state = useRating({
    initial: prevRatingValue,
    mode: ratingFor,
    authorId,
    postId,
    viewerId: user?.currentUserId,
    path: revalidatePath,
    onChange,
  });
  useEffect(() => {
    setHover(0);
  }, [authorId, postId, ratingFor]);
  async function choose(value: number) {
    setHover(0);
    if ((await state.submit(value)) && !state.local) router.refresh();
  }
  const label =
    ratingFor === "FILTER"
      ? "Minimum public rating"
      : ratingFor === "UPLOAD"
        ? "Your rating for this upload"
        : ratingFor === "PROFILE"
          ? "Your profile rating"
          : "Your post rating";
  return (
    <div className="flex min-w-0 flex-col gap-1" aria-busy={state.pending}>
      <fieldset
        disabled={state.pending}
        className="flex items-center gap-0.5"
        onMouseLeave={() => setHover(0)}
      >
        <legend className="sr-only">{label}</legend>
        {[1, 2, 3, 4, 5].map((value) => (
          <label
            key={value}
            className="relative cursor-pointer"
            onMouseEnter={() => {
              if (!state.pending) setHover(value);
            }}
          >
            <input
              type="radio"
              name={name}
              value={value}
              checked={state.rating === value}
              aria-label={`${value} ${value === 1 ? "star" : "stars"}`}
              onChange={() => choose(value)}
              className="peer sr-only"
            />
            <span
              className={`flex size-6 items-center justify-center rounded peer-focus-visible:ring-2 peer-focus-visible:ring-primary-500 peer-focus-visible:ring-offset-2 peer-focus-visible:ring-offset-dark-250 ${state.pending ? "cursor-wait opacity-60" : ""} ${value <= (hover || state.rating) ? "fill-custom-100" : "fill-light-500"}`}
            >
              <StarIcon width="18px" height="18px" />
            </span>
          </label>
        ))}
        {state.local && state.rating > 0 && (
          <button
            type="button"
            onClick={() => choose(0)}
            className="ml-1 rounded px-1 text-xs text-light-600 underline focus-visible:outline-primary-500"
            aria-label="Clear rating"
          >
            Clear
          </button>
        )}
      </fieldset>
      {state.pending && (
        <p role="status" className="text-xs text-light-500">
          Saving rating...
        </p>
      )}
      {state.message && (
        <p role="status" className="max-w-48 text-xs text-light-600">
          {state.message}
        </p>
      )}
      {state.error && (
        <p role="alert" className="max-w-48 text-xs text-primary-500">
          {state.error} Select a star to retry.
        </p>
      )}
    </div>
  );
}
