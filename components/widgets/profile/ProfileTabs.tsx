"use client";

import React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { usePathname } from "next/navigation";

type Tab = {
  title: string;
  value: string;
  content?: string | React.ReactNode | any;
  href: string;
};

type ProfileTabsProps = {
  tabs: Tab[];
  containerClassName?: string;
  activeTabClassName?: string;
  tabClassName?: string;
};

const ProfileTabs = ({
  tabs: propTabs,
  containerClassName,
  activeTabClassName,
  tabClassName,
}: ProfileTabsProps) => {
  const pathname = usePathname();

  const currentPath = pathname.replace(/\/+$/, "");
  const isProfileOverview = /^\/profile\/[^/]+\/[^/]+$/.test(currentPath);

  return (
    <div
      role="navigation"
      aria-label="Profile sections"
      className={cn(
        "relative flex w-full min-w-0 items-center gap-2 overflow-x-auto no-visible-scrollbar [perspective:1000px] sm:gap-4",
        containerClassName,
      )}
    >
      {propTabs.map((tab) => {
        const isActive = isProfileOverview
          ? tab.title.toLowerCase() === "overview"
          : currentPath.endsWith(`/${tab.value}`);

        return (
          <Link
            href={tab.href}
            key={tab.title}
            aria-current={isActive ? "page" : undefined}
            className={cn(
              "relative shrink-0 rounded-full px-3 py-2 first:ml-auto last:mr-auto sm:px-4",
              tabClassName,
            )}
            style={{
              transformStyle: "preserve-3d",
            }}
            scroll={false}
          >
            {isActive && (
              <motion.div
                layoutId="clickedbutton"
                transition={{ type: "spring", bounce: 0.3, duration: 0.6 }}
                className={cn(
                  "absolute inset-0 bg-dark-300 dark:bg-dark-300 rounded-full",
                  activeTabClassName,
                )}
              />
            )}
            <span
              className={cn(
                `${isActive ? "text-light-900" : "text-light-600"} relative block text-sm w-max`,
              )}
            >
              {tab.title}
            </span>
          </Link>
        );
      })}
    </div>
  );
};

export default ProfileTabs;

export const FadeInDiv = ({
  className,
  tabs,
  hovering,
}: {
  className?: string;
  key?: string;
  tabs: Tab[];
  active: Tab;
  hovering?: boolean;
}) => {
  const pathname = usePathname();

  const isActive = (tab: Tab) => {
    return tab.href === pathname;
  };
  return (
    <div className="relative size-full">
      {tabs.map((tab, idx) => (
        <motion.div
          key={tab.value}
          layoutId={tab.value}
          style={{
            scale: 1 - idx * 0.1,
            top: hovering ? idx * -50 : 0,
            zIndex: -idx,
            opacity: idx < 3 ? 1 - idx * 0.1 : 0,
          }}
          animate={{
            y: isActive(tab) ? [0, 40, 0] : 0,
          }}
          className={cn("w-full h-full absolute top-0 left-0", className)}
        >
          {tab.content}
        </motion.div>
      ))}
    </div>
  );
};
