import React from "react";
import { ExploreBgCarousel, ExploreSearchSection } from "@/components/widgets";
import { Tabs } from "@/components/others";
import { EXPLORE_BG_IMAGES, EXPLORE_TABS } from "@/constants";
import {
  getLanguagesAction,
  getProfessionsAction,
} from "@/actions/utils.action";

async function layout({ children }: { children: React.ReactNode }) {
  const langData = await getLanguagesAction();
  const professionData = await getProfessionsAction();

  return (
    <main className="flex w-full flex-col items-center justify-center">
      <header className="sticky top-10 w-full">
        <div className="flex-center relative -mt-10 h-[26rem] w-full flex-col gap-2">
          <ExploreSearchSection
            langData={langData}
            professionData={professionData}
          />
          <Tabs
            tabs={EXPLORE_TABS}
            activeTabClassName="bg-light-900 top-8 left-[44%] transform translate-x-1/2 size-2"
            containerClassName="z-20"
            titleClassName="font-medium"
          />
          <div className="absolute left-0 top-0 z-10 size-full bg-gradient-to-b from-[rgb(17,19,27,0.0)] to-[rgba(0,0,0)]" />
          <ExploreBgCarousel slides={EXPLORE_BG_IMAGES} />
        </div>
      </header>
      <section className="z-30 -mt-4 w-full rounded-t-[30px] bg-dark-200/80 p-8 backdrop-blur-md xl:w-[95%]">
        {children}
      </section>
    </main>
  );
}

export default layout;
