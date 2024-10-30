"use client";

import { Input } from "@/components/ui/input";
import { CiSearch } from "react-icons/ci";
import ExploreFilterSheet from "./ExploreFilterSheet";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { formUrlQuery } from "@/lib/utils";

type Props = {
  langData: any;
  professionData: any;
};

const ExploreSearchSection = ({ langData, professionData }: Props) => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const query = searchParams.get("q");
  const [search, setSearch] = useState(query || "");

  const handleSubmit = () => {
    if (search) {
      const newURL = formUrlQuery({
        params: searchParams.toString(),
        key: "q",
        value: search,
      });
      router.push(newURL, { scroll: false });
    }
  };

  useEffect(() => {
    handleSubmit();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  return (
    <div className="z-20 flex w-full flex-col items-center gap-2">
      {pathname.startsWith("/tags") ? null : (
        <>
          <h1 className="text-center text-3xl font-semibold text-light-900">
            Search For Posts, Shared & Talents
          </h1>
          <p className="w-[85%] text-center text-sm text-light-700">
            Find tech posts, shared resources, and talented professionals.
            Explore, connect, and discover insights within the community.
          </p>
        </>
      )}

      <div className="flex-center w-full gap-5">
        <div className="relative flex w-full max-w-lg">
          <CiSearch className="absolute left-2 top-2.5 text-2xl text-light-500/80" />
          <Input
            placeholder="Search & Explore"
            className="shad-explore-search-input"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {search && (
            <Button
              className="flex-center absolute right-0 top-0 h-11 gap-1 rounded-[10px] rounded-l-none bg-dark-300 text-light-700 hover:text-light-900"
              onClick={handleSubmit}
            >
              Search
            </Button>
          )}
        </div>
        <ExploreFilterSheet
          langData={langData}
          professionData={professionData}
        />
      </div>
    </div>
  );
};

export default ExploreSearchSection;
