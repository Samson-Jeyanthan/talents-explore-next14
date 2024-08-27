import { Skeleton } from "@/components/ui/skeleton";
import React from "react";

function loading() {
    return <div className="text-light-850">loading there
    <Skeleton className="h-24 w-32 bg-custom-100"/>
    </div>;
}

export default loading;
