"use client";

import React, { useState } from "react";
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

export const Tabs = ({
  tabs: propTabs,
  containerClassName,
  activeTabClassName,
  tabClassName,
  contentClassName,
}: {
  tabs: Tab[];
  containerClassName?: string;
  activeTabClassName?: string;
  tabClassName?: string;
  contentClassName?: string;
}) => {
  const pathname = usePathname();

  const [active, setActive] = useState<Tab>(propTabs[0]);
  // const [tabs, setTabs] = useState<Tab[]>(propTabs);

  const moveSelectedTabToTop = (idx: number) => {
    const newTabs = [...propTabs];
    const selectedTab = newTabs.splice(idx, 1);
    newTabs.unshift(selectedTab[0]);
    // setTabs(newTabs);
    setActive(newTabs[0]);
  };

  // const [hovering, setHovering] = useState(false);

  return (
    <div
      className={cn(
        "flex flex-row items-center gap-4 justify-center [perspective:1000px] relative overflow-auto sm:overflow-visible no-visible-scrollbar max-w-max w-full",
        containerClassName
      )}
    >
      {propTabs.map((tab, idx) => {
        const isActive = tab.href === pathname || active.value === tab.value;

        return (
          <Link
            href={tab.href}
            key={tab.title}
            onClick={() => {
              moveSelectedTabToTop(idx);
            }}
            // onMouseEnter={() => setHovering(true)}
            // onMouseLeave={() => setHovering(false)}
            className={cn("relative px-4 py-2 rounded-full", tabClassName)}
            style={{
              transformStyle: "preserve-3d",
            }}
          >
            {isActive && (
              <motion.div
                layoutId="clickedbutton"
                transition={{ type: "spring", bounce: 0.3, duration: 0.6 }}
                className={cn(
                  "absolute inset-0 bg-dark-300 dark:bg-dark-300 rounded-full",
                  activeTabClassName
                )}
              />
            )}
            <span
              className={cn(
                `${isActive ? "text-light-900" : "text-light-600"} relative block text-sm`
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
  const isActive = (tab: Tab) => {
    return tab.value === tabs[0].value;
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
