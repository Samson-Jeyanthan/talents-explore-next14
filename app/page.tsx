"use client";

import { useEffect } from "react";

export default function Home() {
  useEffect(() => {
    // Add the 'active' class to the element when it renders
    const element = document.querySelector(".test-drawer");
    if (element) {
      element.classList.add("active");
    }
  }, []);

  return (
    <main className="test-drawer flex h-[50vh] w-1/2 flex-col items-center justify-center">
      Talents Explore
    </main>
  );
}
