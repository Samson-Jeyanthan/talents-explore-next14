"use client";

import { useParams } from "next/navigation";
import RatingCard from "../cards/RatingCard";
import RadialBar from "./RadialBar";
import HorzBar from "./HorzBar";
import { Button } from "../ui/button";
import { useProfileRatings } from "@/lib/hooks/useProfileRatings";
import { ratingBreakdown } from "@/lib/utils/ratings";

export default function LoadProfileRatingList() {
  const params = useParams();
  const data = useProfileRatings(
    typeof params.userId === "string" ? params.userId : undefined,
  );
  return (
    <section
      className="flex w-full min-w-0 flex-col gap-4"
      aria-label="Profile ratings"
    >
      <Button
        type="button"
        variant="ghost"
        disabled={data.loading || data.summaryLoading}
        onClick={data.refresh}
        className="h-8 self-end px-2 text-xs text-light-600"
      >
        Refresh ratings
      </Button>
      {data.restricted ? (
        <p
          role="status"
          className="rounded-xl border border-dark-400 p-4 text-sm text-light-700"
        >
          This account&apos;s privacy settings do not allow you to view these
          ratings.
        </p>
      ) : (
        <>
          {data.summaryLoading && (
            <p role="status" className="text-center text-sm text-light-500">
              Loading rating summary...
            </p>
          )}
          {data.summary && (
            <div className="flex w-full flex-col items-center gap-3">
              <RadialBar
                avgRating={Math.round(data.summary.avgRating * 10) / 10}
                peopleCount={data.summary.numberOfRating}
              />
              <HorzBar ratingCounts={ratingBreakdown(data.summary)} />
            </div>
          )}
          {data.summaryError && (
            <div
              role="alert"
              className="rounded-xl border border-dark-400 p-4 text-sm text-light-700"
            >
              <p>{data.summaryError}</p>
              <Button
                type="button"
                disabled={data.summaryLoading}
                onClick={data.loadSummary}
                className="shad-button_secondary mt-3"
              >
                Retry summary
              </Button>
            </div>
          )}
          {data.items.map((item, index) => (
            <RatingCard key={item._id} ratingCard={item} index={index} />
          ))}
          {data.loading && (
            <p
              role="status"
              className="py-4 text-center text-sm text-light-500"
            >
              Loading ratings...
            </p>
          )}
          {data.error && (
            <div
              role="alert"
              className="rounded-xl border border-dark-400 p-4 text-sm text-light-700"
            >
              <p>{data.error}</p>
              <Button
                type="button"
                disabled={data.loading}
                onClick={data.load}
                className="shad-button_secondary mt-3"
              >
                Retry ratings
              </Button>
            </div>
          )}
          {!data.loading &&
            !data.error &&
            data.page > 0 &&
            !data.items.length && (
              <p className="py-6 text-center text-sm text-light-500">
                No ratings yet.
              </p>
            )}
          {data.hasMore && !data.error && !data.loading && (
            <Button
              type="button"
              onClick={data.load}
              className="shad-button_secondary self-center"
            >
              Load more ratings
            </Button>
          )}
        </>
      )}
    </section>
  );
}
