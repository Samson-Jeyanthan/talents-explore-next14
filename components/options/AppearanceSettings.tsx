"use client";

import { Monitor, Moon, SunMedium } from "lucide-react";
import { useTheme } from "@/context/ThemeProvider";

export const appearanceOptions = [
  {
    value: "light",
    label: "Light",
    icon: SunMedium,
    description: "Light surfaces and navy text, inspired by the mobile app.",
  },
  {
    value: "dark",
    label: "Dark",
    icon: Moon,
    description: "Dark surfaces for a dimmer viewing experience.",
  },
  {
    value: "system",
    label: "System",
    icon: Monitor,
    description: "Automatically follow your device appearance.",
  },
] as const;

export default function AppearanceSettings() {
  const { mode, setMode } = useTheme();
  return (
    <div
      className="grid gap-3 sm:grid-cols-3"
      role="group"
      aria-label="Colour theme"
    >
      {appearanceOptions.map(({ value, label, icon: Icon, description }) => (
        <button
          key={value}
          type="button"
          aria-pressed={mode === value}
          onClick={() => setMode(value)}
          className={`rounded-2xl border p-4 text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary-500 ${mode === value ? "border-primary-500 bg-primary-500/5" : "border-dark-400 bg-dark-250 hover:bg-dark-300"}`}
        >
          <Icon className="mb-3 size-5 text-light-800" />
          <span className="block text-sm font-semibold text-light-900">
            {label}
          </span>
          <span className="mt-2 block text-xs leading-5 text-light-500">
            {description}
          </span>
        </button>
      ))}
    </div>
  );
}
