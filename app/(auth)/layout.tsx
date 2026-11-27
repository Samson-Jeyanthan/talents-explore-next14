import React from "react";
import Theme from "@/components/options/Theme";
import "@/styles/auth.css";

const Layout = ({ children }: { children: React.ReactNode }) => {
  return (
    <main className="flex min-h-svh w-full items-center justify-center bg-dark-200">
      <div className="fixed right-4 top-4 z-[99]">
        <Theme />
      </div>
      {children}
    </main>
  );
};

export default Layout;
