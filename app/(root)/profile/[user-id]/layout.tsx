import React from "react";
import { ProfileHeader } from "@/components/widgets";

const layout = ({ children }: { children: React.ReactNode }) => {
  return (
    <main className="flex-center">
      <section className="relative flex w-full max-w-screen-xl flex-col">
        <ProfileHeader />
        {children}
      </section>
    </main>
  );
};

export default layout;
