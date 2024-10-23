"use client";

import { PostFilterForm } from "@/components/forms";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetOverlay,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { SlEqualizer } from "react-icons/sl";

const ExploreFilterSheet = ({
  langData,
  professionData,
  countryData,
  stateData,
}: any) => {
  return (
    <Sheet>
      <SheetTrigger className="flex-center h-11 w-[5.5rem] rounded-lg border-dark-400 bg-dark-250 text-lg text-light-500 hover:text-light-900">
        <SlEqualizer className="rotate-90" />
      </SheetTrigger>
      <SheetOverlay />
      <SheetContent className="flex flex-col gap-3 overflow-y-auto border-none bg-dark-200/10 text-light-900">
        <SheetHeader>
          <SheetTitle className="text-xl font-semibold">Filters</SheetTitle>
          <SheetDescription>
            This action cannot be undone. This will permanently delete your
            account and remove your data from our servers.
          </SheetDescription>
        </SheetHeader>
        <PostFilterForm langData={langData} professionData={professionData} />
      </SheetContent>
    </Sheet>
  );
};

export default ExploreFilterSheet;
