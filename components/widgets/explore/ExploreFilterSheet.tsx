"use client";

import { PostFilterForm, TalentsFilterForm } from "@/components/forms";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetOverlay,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { SlEqualizer } from "react-icons/sl";

const ExploreFilterSheet = ({
  langData,
  professionData,
  countryData,
  stateData,
}: any) => {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger className="flex-center h-11 w-[5.5rem] rounded-lg border-dark-400 bg-dark-250 text-lg text-light-500 hover:text-light-900">
        <SlEqualizer className="rotate-90" />
      </SheetTrigger>
      <SheetOverlay />
      <SheetContent className="flex flex-col gap-3 overflow-y-auto border-none bg-dark-200 text-light-900">
        <SheetHeader>
          <SheetTitle className="text-xl font-semibold">Filters</SheetTitle>
          <SheetDescription className="text-sm text-light-500">
            Narrow down your results to find exactly what you&apos;re looking
            for. these filters will help you explore the platform with precision
            and ease.
          </SheetDescription>
        </SheetHeader>
        {pathname.includes("/explore/talents") ? (
          <TalentsFilterForm
            langData={langData}
            professionData={professionData}
            onClose={() => setOpen(false)}
          />
        ) : (
          <PostFilterForm
            langData={langData}
            professionData={professionData}
            onClose={() => setOpen(false)}
          />
        )}
      </SheetContent>
    </Sheet>
  );
};

export default ExploreFilterSheet;
