"use client";

import { useEffect, useState } from "react";
import { useInView } from "react-intersection-observer";
import { getFollowerList } from "@/actions/connection.action";
import ConnectionCard, { IConnectionListProp } from "../cards/ConnectionCard";
import { useUserContext } from "@/context/AuthProvider";
import { useParams } from "next/navigation";

function LoadFollowerList() {
  const { user } = useUserContext();
  const params = useParams();
  const { ref, inView } = useInView();
  const [data, setData] = useState<IConnectionListProp[]>([]);
  const [isEnd, setIsEnd] = useState(false);
  const [page, setPage] = useState(1);

  const urlId: any = params.userId;

  useEffect(() => {
    if (!isEnd) {
      if (inView) {
        getFollowerList(urlId, user.currentUserId, page, 10).then((res) => {
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
        <ConnectionCard
          key={item._id}
          connectCard={item}
          index={index}
          viewerId={user.currentUserId}
        />
      ))}
      {!isEnd && <div ref={ref}>loading...</div>}
    </>
  );
}

export default LoadFollowerList;
