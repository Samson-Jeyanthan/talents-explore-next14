import React from "react";
import { Skeleton } from "@/components/ui/skeleton";

function loading() {
  return (
    <div className="mt-8 flex w-full">
      <div className="my-4 flex h-36 w-[36rem] flex-col gap-4 rounded-[28px] bg-dark-250 p-4 pb-2">
        <div className="flex items-center gap-3">
          <Skeleton className="size-10 rounded-full bg-dark-400" />
          <Skeleton className="h-5 w-80 rounded-2xl bg-dark-400" />
        </div>

        <div className="mt-2 flex flex-col gap-2">
          <Skeleton className="h-3 w-20 rounded-xl bg-dark-400" />
          <Skeleton className="h-3 w-80 rounded-xl bg-dark-400" />
          <Skeleton className="h-3 w-60 rounded-xl bg-dark-400" />
        </div>
      </div>
    </div>
  );
}

export default loading;
