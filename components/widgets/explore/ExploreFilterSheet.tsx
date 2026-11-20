"use client";

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { SlEqualizer } from "react-icons/sl";
import ExploreFilters from "./ExploreFilters";

export default function ExploreFilterSheet() {
  const pathname = usePathname();
  const query = useSearchParams().toString();
  const [open, setOpen] = useState(false);
  useEffect(() => {
    setOpen(false);
  }, [pathname, query]);
  const type = pathname.includes("/explore/talents")
    ? "TALENT"
    : pathname.includes("/explore/shared")
      ? "SHARE"
      : pathname === "/explore"
        ? "ALL"
        : "FEED";
  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger
        aria-label="Filter search results"
        className="flex h-11 w-12 shrink-0 items-center justify-center rounded-lg bg-dark-250 text-lg text-light-700 hover:text-light-900"
      >
        <SlEqualizer className="rotate-90" />
      </SheetTrigger>
      <SheetContent
        className="flex w-full flex-col gap-4 overflow-y-auto border-dark-400 bg-dark-200 text-light-900 sm:max-w-md"
        aria-describedby={undefined}
      >
        <SheetHeader className="pr-6 text-left">
          <SheetTitle>Search filters</SheetTitle>
        </SheetHeader>
        {open && (
          <ExploreFilters
            key={type}
            type={type}
            onClose={() => setOpen(false)}
          />
        )}
      </SheetContent>
    </Sheet>
  );
}
