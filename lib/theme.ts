export type ThemeMode = "light" | "dark" | "system";
export type ResolvedTheme = "light" | "dark";

export const THEME_STORAGE_KEY = "theme";

export function normalizeTheme(value: string | null): ThemeMode {
  return value === "light" || value === "dark" ? value : "system";
}

export function resolveTheme(
  mode: ThemeMode,
  systemDark: boolean,
): ResolvedTheme {
  return mode === "system" ? (systemDark ? "dark" : "light") : mode;
}

export function applyTheme(
  root: HTMLElement,
  mode: ThemeMode,
  systemDark: boolean,
) {
  const resolved = resolveTheme(mode, systemDark);
  root.classList.toggle("dark", resolved === "dark");
  root.dataset.theme = resolved;
  root.style.colorScheme = resolved;
  return resolved;
}

// Run before first paint; storage can be unavailable in restricted browsers.
export const themeBootstrapScript = `(() => {
  let mode = "system";
  try { mode = localStorage.getItem("${THEME_STORAGE_KEY}") || "system"; } catch {}
  const dark = mode === "dark" || (mode !== "light" && window.matchMedia("(prefers-color-scheme: dark)").matches);
  const root = document.documentElement;
  root.classList.toggle("dark", dark);
  root.dataset.theme = dark ? "dark" : "light";
  root.style.colorScheme = dark ? "dark" : "light";
})();`;
