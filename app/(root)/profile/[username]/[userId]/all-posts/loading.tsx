import React from "react";
import { Skeleton } from "@/components/ui/skeleton";

function loading() {
  const array = new Array(2).fill(null);
  return (
    <>
      {array.map((_, i) => (
        <div
          key={i}
          className="my-4 flex w-full gap-4 rounded-[28px] bg-dark-300 p-4"
        >
          <Skeleton className="h-48 w-80 rounded-2xl bg-dark-400" />
          <div className="flex w-full flex-col gap-3">
            <Skeleton className="h-6 w-full rounded-xl bg-dark-400" />
            <div className="flex flex-col gap-2">
              <Skeleton className="h-3 w-80 rounded-xl bg-dark-400" />
              <Skeleton className="h-3 w-80 rounded-xl bg-dark-400" />
              <Skeleton className="h-3 w-60 rounded-xl bg-dark-400" />
            </div>
          </div>
        </div>
      ))}
    </>
  );
}

export default loading;
