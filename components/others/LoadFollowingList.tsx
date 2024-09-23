"use client";

import { useEffect, useState } from "react";
import { useInView } from "react-intersection-observer";
import { getFollowingList } from "@/actions/connection.action";
import ConnectionCard, { IConnectionListProp } from "../cards/ConnectionCard";
import { useUserContext } from "@/context/AuthProvider";
import { useParams } from "next/navigation";
import { toast } from "sonner";

function LoadFollowingList() {
  const { user } = useUserContext();
  const params = useParams();
  const { ref, inView } = useInView();
  const [data, setData] = useState<IConnectionListProp[]>([]);
  const [isEnd, setIsEnd] = useState(false);
  const [page, setPage] = useState(1);

  const urlId: any = params.userId;

  useEffect(() => {
    const fetchData = async () => {
      if (!isEnd && inView) {
        try {
          const res = await getFollowingList(
            urlId,
            user.currentUserId,
            page,
            10
          );

          if (res.status === "7400") {
            setData((prevData) => [...prevData, ...res.response]);
            if (res.response.length === 0) {
              setIsEnd(true);
            } else {
              setPage((prevPage) => prevPage + 1);
            }
          } else {
            toast.error("Could not fetch following list", { duration: 4000 });
            setIsEnd(true);
          }
        } catch (error) {
          console.log("Error fetching following list:", error);
          setIsEnd(true);
        }
      }
    };

    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inView, isEnd, page]);

  return (
    <>
      {data.map((item, index) => (
        <ConnectionCard
          key={item._id}
          connectCard={item}
          index={index}
          viewerId={user.currentUserId}
          connectionTab={2}
        />
      ))}
      {!isEnd && <div ref={ref}>loading...</div>}
    </>
  );
}

export default LoadFollowingList;
