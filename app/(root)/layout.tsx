import React from "react";
import { LeftSidebar, Navbar } from "@/components/widgets";
import { getSession } from "@/lib/session";

const layout = async ({ children }: { children: React.ReactNode }) => {
  const session = await getSession();

  return (
    <main className="flex min-h-screen w-full bg-dark-200">
      {session ? <LeftSidebar /> : null}
      <section className="relative flex w-full flex-col items-center bg-dark-200">
        {session ? <Navbar /> : null}
        <div className="flex w-full max-w-screen-xl items-start justify-center px-4 pb-8 3xl:p-0">
          {children}
        </div>
      </section>
    </main>
  );
};

export default layout;
