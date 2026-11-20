import React, { Suspense } from "react";
import { ExploreSearchSection } from "@/components/widgets";
import { Tabs } from "@/components/others";
import { EXPLORE_TABS } from "@/constants";
import {
  getLanguagesAction,
  getProfessionsAction,
} from "@/actions/utils.action";
import Image from "next/image";

async function layout({ children }: { children: React.ReactNode }) {
  const langData = await getLanguagesAction();
  const professionData = await getProfessionsAction();

  return (
    <main className="flex w-full flex-col items-center justify-center">
      <header className="w-full">
        <div className="flex-center relative h-[26rem] w-full flex-col gap-2">
          <Suspense fallback={<div>Loading...</div>}>
            <ExploreSearchSection
              langData={langData}
              professionData={professionData}
            />
          </Suspense>
          <Tabs
            tabs={EXPLORE_TABS}
            activeTabClassName="bg-light-900 top-8 left-[44%] transform translate-x-1/2 size-2"
            containerClassName="z-20"
            titleClassName="font-medium"
          />
          <div className="absolute left-0 top-0 z-10 size-full bg-gradient-to-b from-[rgb(17,19,27,0.0)] to-[rgba(0,0,0)]" />
          <Image
            src="/assets/images/explore-cover.png"
            alt="explore-cover"
            width={1024}
            height={1024}
            className="absolute left-0 top-0 z-0 flex size-full h-[26rem] w-full overflow-hidden bg-dark-200 !object-cover"
          />
        </div>
      </header>
      <section className="w-full bg-dark-200/80 p-8 backdrop-blur-[80px]">
        {children}
      </section>
    </main>
  );
}

export default layout;
