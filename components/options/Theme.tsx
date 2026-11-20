"use client";

import {
  Menubar,
  MenubarContent,
  MenubarItem,
  MenubarMenu,
  MenubarTrigger,
} from "@/components/ui/menubar";
import { Check, Monitor, Moon, SunMedium } from "lucide-react";
import { THEME_OPTIONS } from "@/constants";
import { useTheme } from "@/context/ThemeProvider";
import type { ThemeMode } from "@/lib/theme";

const renderThemeIcon = (icon: "light" | "dark" | "system") => {
  if (icon === "dark") {
    return <Moon className="size-4" />;
  }

  if (icon === "light") {
    return <SunMedium className="size-4" />;
  }

  return <Monitor className="size-4" />;
};

const Theme = () => {
  const { mode, setMode } = useTheme();
  return (
    <Menubar className="relative border-none bg-transparent p-0">
      <MenubarMenu>
        <MenubarTrigger
          aria-label="Change colour theme"
          title="Change colour theme"
          className={`${mode === "dark" ? "text-custom-100" : "text-light-600"} flex-center size-9 cursor-pointer rounded-full bg-dark-300 p-0 text-base  hover:bg-dark-400 hover:text-light-900`}
        >
          {renderThemeIcon(mode)}
        </MenubarTrigger>
        <MenubarContent
          align="end"
          className="z-[110] min-w-36 gap-10 rounded-lg border border-solid border-dark-400 bg-dark-250 p-2 shadow-xl shadow-black/10"
        >
          {THEME_OPTIONS.map((item, index) => (
            <MenubarItem
              onSelect={() => setMode(item.value as ThemeMode)}
              aria-label={`${item.name} theme${mode === item.value ? ", selected" : ""}`}
              className={`${index === 0 ? "" : "mt-1"} w-32 cursor-pointer gap-3 rounded bg-dark-300 fill-light-600 text-light-600 hover:bg-dark-400 hover:fill-light-900 hover:text-light-900`}
              key={index}
            >
              {renderThemeIcon(item.icon)}
              <p className="text-xs">{item.name}</p>
              {mode === item.value && <Check className="ml-auto size-4" />}
            </MenubarItem>
          ))}
        </MenubarContent>
      </MenubarMenu>
    </Menubar>
  );
};

export default Theme;
