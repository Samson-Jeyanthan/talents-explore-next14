"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useInView } from "react-intersection-observer";
import RatingCard, { IRatingListProp } from "../cards/RatingCard";
import { getProfileRatingList } from "@/actions/connection.action";
import RadialBar from "./RadialBar";
import { fetchProfileOverallRating } from "@/lib/functions/connect.functions";
import HorzBar from "./HorzBar";

function LoadProfileRatingList() {
  const params = useParams();
  const { ref, inView } = useInView();
  const [data, setData] = useState<IRatingListProp[]>([]);
  const [isEnd, setIsEnd] = useState(false);
  const [page, setPage] = useState(1);
  const urlId: any = params.userId;

  const [isOverallListLoading, setIsOverallListLoading] = useState(true);
  const [overallList, setOverallList] = useState({
    avgRating: null,
    numberOfRating: 0,
    oneStar: 0,
    twoStar: 0,
    threeStar: 0,
    fourStar: 0,
    fiveStar: 0,
  });

  useEffect(() => {
    if (!isEnd) {
      if (inView) {
        getProfileRatingList(urlId, page, 10).then((res) => {
          setData([...data, ...res]);
          if (res.length === 0) {
            setIsEnd(true);
          } else {
            setPage(page + 1);
          }
        });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inView, data, isEnd, page]);

  useEffect(() => {
    fetchProfileOverallRating(setOverallList, urlId, setIsOverallListLoading);
  }, [urlId]);

  const overallRatingForHorzBar = [
    {
      no: 5,
      value: overallList?.fiveStar,
      percentage: (overallList?.fiveStar / overallList?.numberOfRating) * 100,
    },
    {
      no: 4,
      value: overallList?.fourStar,
      percentage: (overallList?.fourStar / overallList?.numberOfRating) * 100,
    },
    {
      no: 3,
      value: overallList?.threeStar,
      percentage: (overallList?.threeStar / overallList?.numberOfRating) * 100,
    },
    {
      no: 2,
      value: overallList?.twoStar,
      percentage: (overallList?.twoStar / overallList?.numberOfRating) * 100,
    },
    {
      no: 1,
      value: overallList?.oneStar,
      percentage: (overallList?.oneStar / overallList?.numberOfRating) * 100,
    },
  ];

  return (
    <>
      {!isOverallListLoading && (
        <RadialBar
          avgRating={
            overallList?.avgRating === null
              ? 0
              : Number(
                  (Math.round(overallList?.avgRating * 10) / 10).toFixed(1)
                )
          }
          peopleCount={overallList?.numberOfRating || 0}
        />
      )}
      {!isOverallListLoading && (
        <HorzBar ratingCounts={overallRatingForHorzBar} />
      )}
      {data.map((item, index) => (
        <RatingCard key={item._id} ratingCard={item} index={index} />
      ))}
      {!isEnd && <div ref={ref}>loading...</div>}
    </>
  );
}

export default LoadProfileRatingList;
