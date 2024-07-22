import React from "react";
import { IconType } from "react-icons/lib";
import {
  CommunityIcon,
  ExploreIcon,
  HomeIcon,
  SaveIcon,
  SettingsIcon,
  SystemIcon,
  UploadIcon,
} from "@/public/assets/svgs";
import { TConvertedSvgJsxProps } from "@/types/utils.types";
import { IoMdMoon } from "react-icons/io";
import { TbSunHigh } from "react-icons/tb";

export const GENDER_VALUES = [
  {
    id: "male",
    name: "Male",
  },
  {
    id: "female",
    name: "Female",
  },
  {
    id: "other",
    name: "Other",
  },
  {
    id: "prefferNotToSay",
    name: "Prefer not to say",
  },
];

interface SidebarItem {
  icon: IconType | React.ComponentType<TConvertedSvgJsxProps>;
  path: string;
  name: string;
  isLink: boolean;
}

export const SIDEBAR_ITEMS: SidebarItem[] = [
  {
    icon: HomeIcon,
    path: "/home",
    name: "Home",
    isLink: true,
  },
  {
    icon: ExploreIcon,
    path: "/explore",
    name: "Explore",
    isLink: true,
  },
  {
    icon: UploadIcon,
    path: "",
    name: "Upload",
    isLink: false,
  },
  {
    icon: SaveIcon,
    path: "/saved-collection",
    name: "Saved Collection",
    isLink: true,
  },
  {
    icon: CommunityIcon,
    path: "/community",
    name: "Community",
    isLink: true,
  },
  {
    icon: SettingsIcon,
    path: "/settings",
    name: "Settings",
    isLink: true,
  },
];

interface ThemeItems {
  name: string;
  value: string;
  icon: IconType | React.ComponentType<TConvertedSvgJsxProps>;
  height: string | undefined;
}

export const THEME_OPTIONS: ThemeItems[] = [
  { name: "Light", value: "light", icon: TbSunHigh, height: undefined },
  { name: "Dark", value: "dark", icon: IoMdMoon, height: undefined },
  { name: "System", value: "system", icon: SystemIcon, height: "16px" },
];
