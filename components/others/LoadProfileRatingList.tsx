"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useInView } from "react-intersection-observer";
import RatingCard, { IRatingListProp } from "../cards/RatingCard";
import { getProfileRatingList } from "@/actions/connection.action";

function LoadProfileRatingList() {
  //   const [overallList, setOverallList] = useState({
  //     avgRating: null,
  //     numberOfRating: 0,
  //   });

  const params = useParams();
  const { ref, inView } = useInView();
  const [data, setData] = useState<IRatingListProp[]>([]);
  const [isEnd, setIsEnd] = useState(false);
  const [page, setPage] = useState(1);
  const urlId: any = params.userId;

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
  return (
    <>
      {data.map((item, index) => (
        <RatingCard key={item._id} ratingCard={item} index={index} />
      ))}
      {!isEnd && <div ref={ref}>loading...</div>}
    </>
  );
}

export default LoadProfileRatingList;
