import React from "react";
import { LeftSidebar, Navbar } from "@/components/widgets";

const layout = ({ children }: { children: React.ReactNode }) => {
  return (
    <main className="flex min-h-screen w-full">
      <LeftSidebar />
      <section className="relative flex w-full flex-col bg-dark-200">
        <Navbar />
        {children}
      </section>
    </main>
  );
};

export default layout;
