import { ratingPercentage } from "@/lib/utils/ratings";

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
    <div className="my-1 mb-2 flex w-full min-w-0 max-w-[350px] flex-col items-start justify-center gap-2.5">
      {ratingCounts.map((item: any, index: number) => (
        <div
          key={index}
          className="flex w-full items-center justify-start gap-2.5"
        >
          <p className="flex w-14 shrink-0 items-center justify-start text-xs text-light-600">
            {item.no} {item.no === 1 ? "Star" : "Stars"}
          </p>
          <div
            className="relative h-1.5 min-w-0 flex-1 rounded-md bg-dark-400"
            role="progressbar"
            aria-label={`${item.no} star ratings`}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={ratingPercentage(item.percentage, 100)}
          >
            <span
              className="absolute h-full rounded-md bg-custom-100"
              style={{ width: `${ratingPercentage(item.percentage, 100)}%` }}
            ></span>
          </div>
          <p className="min-w-5 shrink-0 text-right text-xs text-light-600">
            {Number.isFinite(item.value) && item.value >= 0 ? item.value : 0}
          </p>
        </div>
      ))}
    </div>
  );
};

export default HorzBar;
