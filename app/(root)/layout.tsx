import React from "react";
import { LeftSidebar, Navbar } from "@/components/widgets";
import { getSession } from "@/lib/session";

const layout = async ({ children }: { children: React.ReactNode }) => {
  const session = await getSession();

  return (
    <main className="flex min-h-screen w-full bg-dark-200">
      {session ? <LeftSidebar /> : null}
      <section className="relative flex w-full flex-col items-center bg-dark-200 pb-8">
        {session ? <Navbar /> : null}
        <div className="mx-auto flex w-full max-w-5xl items-start justify-center p-4 pt-0 2xl:max-w-[1200px] 2xl:py-8 3xl:p-0">
          {children}
        </div>
      </section>
    </main>
  );
};

export default layout;
