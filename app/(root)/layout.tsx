import React from "react";
import { LeftSidebar } from "@/components/widgets";

const layout = ({ children }: { children: React.ReactNode }) => {
  return (
    <main className="flex min-h-screen w-full">
      <LeftSidebar />
      <section className="flex w-full flex-col bg-dark-200">
        <nav className="text-light-900">Navbar</nav>
        {children}
      </section>
    </main>
  );
};

export default layout;
