import React from "react";
import { LeftSidebar, Navbar } from "@/components/widgets";
import { getSession } from "@/lib/session";

type Props = {
  children: React.ReactNode;
};
const layout = async ({ children }: Props) => {
  const session = await getSession();

  return (
    <main className="relative flex min-h-screen w-full min-w-0 overflow-x-clip bg-dark-200 pt-0">
      {session ? <LeftSidebar /> : null}
      <section className="relative flex w-full min-w-0 flex-col items-center overflow-x-clip bg-dark-200">
        {session ? <Navbar userId={session} /> : null}
        <div className="flex-center w-full min-w-0">{children}</div>
      </section>
    </main>
  );
};

export default layout;
