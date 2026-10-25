"use client";

import { getLanguagesAction } from "@/actions/utils.action";
import { PostFilterForm, TalentsFilterForm } from "@/components/forms";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { SlEqualizer } from "react-icons/sl";

const ExploreFilterSheet = ({
  professionData,
  countryData,
  stateData,
}: any) => {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [langData, setLangData] = useState<{ _id: string; name: string }[]>([]);

  async function fetchLangData() {
    const data = await getLanguagesAction();
    console.log("fetch-lang-data", data);

    const langOptions = data?.response?.map((item: any) => ({
      _id: item._id,
      name: item.language,
    }));

    setLangData(langOptions ?? []);
  }

  useEffect(() => {
    fetchLangData();
  }, [open]);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger className="flex-center h-11 w-[5.5rem] rounded-lg border-dark-400 bg-dark-250 text-lg text-light-500 hover:text-light-900">
        <SlEqualizer className="rotate-90" />
      </SheetTrigger>
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
          <PostFilterForm langData={langData} onClose={() => setOpen(false)} />
        )}
      </SheetContent>
    </Sheet>
  );
};

export default ExploreFilterSheet;
