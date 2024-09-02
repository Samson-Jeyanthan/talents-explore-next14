import React from "react";
import { LeftSidebar, Navbar } from "@/components/widgets";
import { getSession } from "@/lib/session";

const layout = async ({ children }: { children: React.ReactNode }) => {
  const session = await getSession();

  return (
    <main className="flex min-h-screen w-full bg-dark-200">
      {session ? <LeftSidebar /> : null}
      <section className="relative flex w-full flex-col bg-dark-200">
        {session ? <Navbar /> : null}
        {children}
      </section>
    </main>
  );
};

export default layout;
