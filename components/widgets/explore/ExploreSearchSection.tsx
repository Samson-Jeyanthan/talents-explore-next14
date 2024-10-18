"use client";

import { Input } from "@/components/ui/input";
import { CiSearch } from "react-icons/ci";
import ExploreFilterSheet from "./ExploreFilterSheet";

const ExploreSearchSection = ({ langData, professionData }: any) => {
  // const [searchValue, setSearchValue] = useState('')
  return (
    <div className="z-20 flex flex-col items-center gap-2">
      <h1 className="text-center text-3xl font-semibold text-light-900">
        Search For Posts, Shared & Talents
      </h1>
      <p className="w-[85%] text-center text-sm text-light-700">
        Find tech posts, shared resources, and talented professionals. Explore,
        connect, and discover insights within the community.
      </p>
      <div className="flex-center w-full gap-5">
        <div className="relative flex w-full max-md:w-[85%] md:max-w-xl">
          <CiSearch className="absolute left-2 top-2.5 text-2xl text-light-500/80" />
          <Input
            placeholder="Search & Explore"
            className="shad-explore-search-input"
          />
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
