import React from "react";
import { IconType } from "react-icons/lib";
import {
  CategoriesIcon,
  CommunityIcon,
  ExploreIcon,
  HomeIcon,
  PinIcon,
  SaveIcon,
  SettingsIcon,
  SystemIcon,
  UploadIcon,
  WarningIcon,
} from "@/public/assets/svgs";
import { ITab, TConvertedSvgJsxProps } from "@/types/utils.types";
import { IoMdMoon } from "react-icons/io";
import { TbSunHigh } from "react-icons/tb";
import { AiOutlineLink } from "react-icons/ai";
import { MdDelete, MdModeEdit } from "react-icons/md";

export const LEVEL_VALUES = [
  { _id: "beginner", name: "Beginner" },
  { _id: "intermediate", name: "Intermediate" },
  { _id: "advanced", name: "Advanced" },
];

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
    icon: CategoriesIcon,
    path: "",
    name: "Categories",
    isLink: false,
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

interface IPostOptions {
  id: number;
  name: string;
  icon: IconType | React.ComponentType<TConvertedSvgJsxProps>;
  height: string | undefined;
  isOwnPost: boolean;
  isRed?: boolean;
}

export const POST_OPTIONS: IPostOptions[] = [
  {
    id: 0,
    name: "Pin on Profile",
    icon: PinIcon,
    height: "16px",
    isOwnPost: true,
  },
  {
    id: 1,
    name: "Copy Link",
    icon: AiOutlineLink,
    height: undefined,
    isOwnPost: true,
  },
  {
    id: 2,
    name: "Edit Post",
    icon: MdModeEdit,
    height: undefined,
    isOwnPost: true,
  },
  {
    id: 3,
    name: "Delete Post",
    icon: MdDelete,
    height: undefined,
    isOwnPost: true,
    isRed: true,
  },
  {
    id: 4,
    name: "Copy Link",
    icon: AiOutlineLink,
    height: undefined,
    isOwnPost: false,
  },
  {
    id: 5,
    name: "Report",
    icon: WarningIcon,
    height: "16px",
    isOwnPost: false,
    isRed: true,
  },
];

interface IProfileOptions {
  id: number;
  name: string;
  icon: IconType | React.ComponentType<TConvertedSvgJsxProps>;
  height: string | undefined;
  isOwnProfile: boolean;
  isRed?: boolean;
}

export const PROFILE_OPTIONS: IProfileOptions[] = [
  {
    id: 0,
    name: "Copy Link",
    icon: AiOutlineLink,
    height: undefined,
    isOwnProfile: true,
  },
  {
    id: 1,
    name: "Report",
    icon: WarningIcon,
    height: "16px",
    isOwnProfile: false,
    isRed: true,
  },
  {
    id: 2,
    name: "Block",
    icon: WarningIcon,
    height: "16px",
    isOwnProfile: false,
    isRed: true,
  },
];

interface ISavedFolderOptions {
  name: string;
  icon: IconType | React.ComponentType<TConvertedSvgJsxProps>;
  height: string | undefined;
  isRed?: boolean;
}

export const SAVED_FOLDER_OPTIONS: ISavedFolderOptions[] = [
  {
    name: "Rename",
    icon: MdModeEdit,
    height: undefined,
  },
  {
    name: "Delete Folder",
    icon: MdDelete,
    height: undefined,
    isRed: true,
  },
];

interface IFooterLinks {
  name: string;
  path: string;
}

export const FOOTER_LINKS: IFooterLinks[] = [
  {
    name: "Terms & Conditions",
    path: "https://talentsexplore.com/terms-and-conditions",
  },
  {
    name: "Privacy Policy",
    path: "https://talentsexplore.com/privacy-policy",
  },
  {
    name: "Branded Policy",
    path: "https://talentsexplore.com/branded-policy",
  },
  {
    name: "Cookies",
    path: "https://talentsexplore.com/cookies-policy",
  },
  {
    name: "Community",
    path: "https://talentsexplore.com/community-guidelines",
  },
  {
    name: "Intellectual Property",
    path: "https://talentsexplore.com/intellectual-property-policy",
  },
];

export const EXPLORE_TABS: ITab[] = [
  {
    title: "All",
    value: "",
    href: "/explore",
  },
  {
    title: "Posts",
    value: "posts",
    href: "/explore/posts",
  },
  {
    title: "Talents",
    value: "talents",
    href: "/explore/talents",
  },
  {
    title: "Shared",
    value: "shared",
    href: "/explore/shared",
  },
];

export const EXPLORE_BG_IMAGES = [
  "/assets/images/explore-cover.jpg",
  "/assets/images/explore-cover-3.jpg",
  "/assets/images/explore-cover.jpg",
  "/assets/images/explore-cover-2.jpg",
  "/assets/images/explore-cover.jpg",
];

export const TIME_DURATION_FILTERS = [
  {
    id: "one month",
    name: "This Month",
  },
  {
    id: "six month",
    name: "Six Months",
  },
  {
    id: "one year",
    name: "This Year",
  },
  {
    id: "two year",
    name: "Two Years",
  },
];
