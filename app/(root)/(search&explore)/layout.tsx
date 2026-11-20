import React, { Suspense } from "react";
import { ExploreSearchSection } from "@/components/widgets";
import { Tabs } from "@/components/others";
import { EXPLORE_TABS } from "@/constants";
import {
  getLanguagesAction,
  getProfessionsAction,
} from "@/actions/utils.action";

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
          <div className="theme-page-gradient absolute left-0 top-0 z-10 size-full" />
          <div className="absolute inset-0 z-0 bg-[url('/assets/images/explore-cover.png')] bg-cover bg-center" />
        </div>
      </header>
      <section className="w-full bg-dark-200/80 p-8 backdrop-blur-[80px]">
        {children}
      </section>
    </main>
  );
}

export default layout;
