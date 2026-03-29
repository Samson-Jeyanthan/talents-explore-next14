"use client";

import {
  Menubar,
  MenubarContent,
  MenubarItem,
  MenubarMenu,
  MenubarTrigger,
} from "@/components/ui/menubar";
import { Moon, SunMedium } from "lucide-react";
import { SystemIcon } from "@/public/assets/svgs";
import { THEME_OPTIONS } from "@/constants";

const renderThemeIcon = (icon: "light" | "dark" | "system") => {
  if (icon === "dark") {
    return <Moon className="size-4" />;
  }

  if (icon === "light") {
    return <SunMedium className="size-4" />;
  }

  return <SystemIcon height="16px" width="16px" />;
};

const Theme = () => {
  const mode = "dark";
  return (
    <Menubar className="relative border-none bg-transparent p-0">
      <MenubarMenu>
        <MenubarTrigger
          className={`${mode === "dark" ? "text-custom-100" : "text-light-600"} flex-center size-9 cursor-pointer rounded-full bg-dark-300 p-0 text-base  hover:bg-dark-400 hover:text-light-900`}
        >
          {mode === "dark" ? <Moon className="size-4" /> : <SunMedium className="size-4" />}
        </MenubarTrigger>
        <MenubarContent className="absolute -right-5 z-[99] min-w-32 gap-10 rounded-lg border border-solid border-dark-400 bg-dark-300 p-2 shadow-xl shadow-dark-100/25">
          {THEME_OPTIONS.map((item, index) => (
            <MenubarItem
              className={`${index === 0 ? "" : "mt-1"} w-32 cursor-pointer gap-3 rounded bg-dark-300 fill-light-600 text-light-600 hover:bg-dark-400 hover:fill-light-900 hover:text-light-900`}
              key={index}
            >
              {renderThemeIcon(item.icon)}
              <p className="text-xs">{item.name}</p>
            </MenubarItem>
          ))}
        </MenubarContent>
      </MenubarMenu>
    </Menubar>
  );
};

export default Theme;
