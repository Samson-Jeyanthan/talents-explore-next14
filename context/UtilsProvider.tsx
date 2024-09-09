"use client";

import React, { createContext, useContext, useState } from "react";

type UtilsContextType = {
  mdSelectedMediaIndex: number;
  setmdSelectedMediaIndex: React.Dispatch<React.SetStateAction<number>>;
};

const INITIAL_STATE: UtilsContextType = {
  mdSelectedMediaIndex: 0,
  setmdSelectedMediaIndex: () => {},
};

const UtilsContext = createContext<UtilsContextType>(INITIAL_STATE);

export function UtilsProvider({ children }: { children: React.ReactNode }) {
  const [mdSelectedMediaIndex, setmdSelectedMediaIndex] = useState(0);

  const value = {
    mdSelectedMediaIndex,
    setmdSelectedMediaIndex,
  };

  return (
    <UtilsContext.Provider value={value}>{children}</UtilsContext.Provider>
  );
}

export const useUtils = () => useContext(UtilsContext);
