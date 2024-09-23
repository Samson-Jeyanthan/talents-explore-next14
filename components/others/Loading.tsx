import React from "react";
// import { Skeleton } from "../ui/skeleton";

function Loading() {
  const array = new Array(6).fill(null);

  return (
    <div className="grid w-full max-w-7xl grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {array.map((_, i) => (
        <div key={i} className="relative h-72 rounded-lg bg-zinc-700 p-4">
          <div className="mb-2 h-6 w-28" />

          <div className="mb-1 h-5 w-[97%]" />
          <div className="mb-1 h-5 w-[99%]" />
          <div className="mb-1 h-5 w-[95%]" />
          <div className="h-5 w-[92%]" />

          <div className="absolute bottom-4 right-4 h-4 w-28" />
        </div>
      ))}
    </div>
  );
}

export default Loading;
