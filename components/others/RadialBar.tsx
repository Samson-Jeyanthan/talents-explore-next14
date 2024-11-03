import { StarIcon } from "@/public/assets/svgs";

interface RadialBarProps {
  avgRating: number;
  peopleCount?: number;
}

const RadialBar = ({ avgRating, peopleCount }: RadialBarProps) => {
  const percentage = (avgRating / 5) * 100;
  const dashArray = Math.PI * 100; // Assuming the circle has a radius of 50
  const dashOffset = dashArray - (dashArray * percentage) / 100;

  return (
    <div className="relative -mt-2 flex h-[7.5rem] w-40 flex-col items-center justify-center ">
      <svg className="size-40 -rotate-90" x="0px" y="0px" viewBox="0 0 200 120">
        <circle
          cx="100"
          cy="60"
          r="50"
          className="stroke-current text-dark-400"
          strokeWidth="8"
          strokeLinecap="round"
          fill="transparent"
        />
        <circle
          cx="100"
          cy="60"
          r="50"
          className="stroke-current text-custom-100"
          strokeWidth="8"
          strokeLinecap="round"
          fill="transparent"
          strokeDasharray={dashArray}
          strokeDashoffset={dashOffset}
        />
      </svg>
      <span className="absolute top-1/3 text-lg text-light-900">
        {avgRating === 0 ? "N/A" : avgRating}
      </span>
      <p className="mt-px text-xs text-light-600">{peopleCount} Ratings</p>
    </div>
  );
};

export default RadialBar;

export const UserRatingRadialBar = ({ avgRating }: RadialBarProps) => {
  const percentage = (avgRating / 5) * 100;
  let dashArray = 0;
  if (avgRating < 5 && avgRating > 4.5) {
    dashArray = Math.PI * 165;
  } else {
    dashArray = Math.PI * 170; // Assuming the circle has a radius of 50
  }
  const dashOffset = dashArray - (dashArray * percentage) / 100;
  return (
    <div className="relative flex size-20 items-center justify-center">
      <svg
        className="size-20 -rotate-90"
        x="0px"
        y="0px"
        viewBox="0 0 200.000000 125.000000"
      >
        <circle
          cx="100"
          cy="60"
          r="85"
          className="stroke-current text-dark-400"
          strokeWidth="12"
          strokeLinecap="round"
          fill="transparent"
        />
        <circle
          cx="100"
          cy="60"
          r="85"
          className="stroke-current text-custom-100"
          strokeWidth="12"
          strokeLinecap="round"
          fill="transparent"
          strokeDasharray={dashArray}
          strokeDashoffset={dashOffset}
        />
      </svg>
      <span className="flex-center absolute gap-1 fill-custom-100 text-sm text-light-900">
        <StarIcon width="14px" height="14px" />
        {Math.floor(avgRating) === 0 ? "N/A" : avgRating.toFixed(1)}
      </span>
    </div>
  );
};
