"use client";

import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from "react";
import TransparentLoader from "@/components/modals/TransparentLoader";

type LoadingContextValue = {
  isLoading: boolean;
  message: string;
  beginLoading: (message?: string) => () => void;
  withLoading: <T>(message: string, operation: () => Promise<T>) => Promise<T>;
};

const LoadingContext = createContext<LoadingContextValue | null>(null);

export function LoadingProvider({ children }: { children: ReactNode }) {
  const operations = useRef(new Map<number, string>());
  const nextId = useRef(0);
  const [activeOperations, setActiveOperations] = useState<[number, string][]>([]);

  const sync = useCallback(() => {
    setActiveOperations(Array.from(operations.current.entries()));
  }, []);

  const beginLoading = useCallback(
    (message = "Loading...") => {
      const id = ++nextId.current;
      operations.current.set(id, message);
      sync();

      return () => {
        if (operations.current.delete(id)) {
          sync();
        }
      };
    },
    [sync]
  );

  const withLoading = useCallback(
    async <T,>(message: string, operation: () => Promise<T>) => {
      const finish = beginLoading(message);
      try {
        return await operation();
      } finally {
        finish();
      }
    },
    [beginLoading]
  );

  const value = useMemo<LoadingContextValue>(
    () => ({
      isLoading: activeOperations.length > 0,
      message: activeOperations[activeOperations.length - 1]?.[1] || "Loading...",
      beginLoading,
      withLoading,
    }),
    [activeOperations, beginLoading, withLoading]
  );

  return (
    <LoadingContext.Provider value={value}>
      {children}
      {value.isLoading ? <TransparentLoader text={value.message} /> : null}
    </LoadingContext.Provider>
  );
}

export function useGlobalLoading() {
  const context = useContext(LoadingContext);
  if (!context) {
    throw new Error("useGlobalLoading must be used within LoadingProvider");
  }
  return context;
}
