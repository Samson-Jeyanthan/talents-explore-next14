interface RatingCount {
  no: number;
  percentage: number;
  value: number;
}

interface HorzBarProps {
  ratingCounts: RatingCount[];
}

const HorzBar = ({ ratingCounts }: HorzBarProps) => {
  return (
    <div className="my-1 mb-2 flex w-[350px] flex-col items-start justify-center gap-2.5">
      {ratingCounts.map((item: any, index: number) => (
        <div
          key={index}
          className="flex w-full items-center justify-start gap-2.5"
        >
          <p className="flex w-14 items-center justify-start text-xs text-light-600">
            {item.no} {item.no === 1 ? "Star" : "Stars"}
          </p>
          <div className="relative h-1.5 w-[90%] rounded-md bg-dark-400">
            <span
              className="absolute h-full rounded-md bg-custom-100"
              style={{ width: `${item.percentage}%` }}
            ></span>
          </div>
          <p className="grid w-4 place-content-center text-xs text-light-600">
            {item.value}
          </p>
        </div>
      ))}
    </div>
  );
};

export default HorzBar;
