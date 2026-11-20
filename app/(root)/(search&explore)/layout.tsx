import React, { Suspense } from "react";
import ExploreSearchSection from "@/components/widgets/explore/ExploreSearchSection";
import ExploreTabs from "@/components/widgets/explore/ExploreTabs";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <main className="flex w-full min-w-0 flex-col items-center">
      <header className="relative flex min-h-80 w-full flex-col items-center justify-center gap-5 bg-[url('/assets/images/explore-cover.png')] bg-cover bg-center px-4 py-10 sm:px-8">
        <div className="theme-page-gradient absolute inset-0 z-0" />
        <Suspense fallback={<p role="status">Loading search...</p>}>
          <ExploreSearchSection />
          <ExploreTabs />
        </Suspense>
      </header>
      <div className="w-full min-w-0 bg-dark-200/80 p-4 backdrop-blur-[80px] sm:p-8">
        {children}
      </div>
    </main>
  );
}
