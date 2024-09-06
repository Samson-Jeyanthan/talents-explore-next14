interface RadialBarProps {
  avgRating: number;
  peopleCount: number;
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
