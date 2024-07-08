"use client";

import React, { useEffect } from "react";
import { store } from "./store";
import { Provider } from "react-redux";

export default function ReduxProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const handleThemeChange = () => {
    if (
      localStorage.theme === "dark" ||
      (!("theme" in localStorage) &&
        window.matchMedia("(prefers-color-scheme: dark)").matches)
    ) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
    console.log("theme", localStorage.theme);
  };

  useEffect(() => {
    handleThemeChange();
  }, []);

  return <Provider store={store}>{children}</Provider>;
}
