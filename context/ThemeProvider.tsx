"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
} from "react";
import {
  applyTheme,
  normalizeTheme,
  THEME_STORAGE_KEY,
  ThemeMode,
  ResolvedTheme,
} from "@/lib/theme";

type ThemeContextType = {
  mode: ThemeMode;
  resolvedTheme: ResolvedTheme;
  setMode: (mode: ThemeMode) => void;
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setPreference] = useState<ThemeMode>("system");
  const [resolvedTheme, setResolvedTheme] = useState<ResolvedTheme>("light");
  const preference = useRef<ThemeMode>("system");
  const syncTheme = useCallback((value: ThemeMode) => {
    preference.current = value;
    setPreference(value);
    setResolvedTheme(
      applyTheme(
        document.documentElement,
        value,
        window.matchMedia("(prefers-color-scheme: dark)").matches,
      ),
    );
  }, []);
  const setMode = useCallback(
    (value: ThemeMode) => {
      try {
        localStorage.setItem(THEME_STORAGE_KEY, value);
      } catch {
        /* Keep the choice for this session if storage is blocked. */
      }
      syncTheme(value);
    },
    [syncTheme],
  );

  useEffect(() => {
    let stored: ThemeMode = "system";
    try {
      stored = normalizeTheme(localStorage.getItem(THEME_STORAGE_KEY));
    } catch {}
    syncTheme(stored);
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const onSystemChange = () => {
      if (preference.current === "system") syncTheme("system");
    };
    const onStorage = (event: StorageEvent) => {
      if (
        event.storageArea === localStorage &&
        (event.key === THEME_STORAGE_KEY || event.key === null)
      )
        syncTheme(normalizeTheme(event.newValue));
    };
    media.addEventListener("change", onSystemChange);
    window.addEventListener("storage", onStorage);
    return () => {
      media.removeEventListener("change", onSystemChange);
      window.removeEventListener("storage", onStorage);
    };
  }, [syncTheme]);

  return (
    <ThemeContext.Provider value={{ mode, resolvedTheme, setMode }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }

  return context;
}
