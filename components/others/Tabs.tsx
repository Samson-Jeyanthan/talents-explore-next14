"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { usePathname } from "next/navigation";
import { ITab } from "@/types/utils.types";

type TabsProps = {
  tabs: ITab[];
  containerClassName?: string;
  activeTabClassName?: string;
  tabClassName?: string;
};

const Tabs = ({
  tabs: propTabs,
  containerClassName,
  activeTabClassName,
  tabClassName,
}: TabsProps) => {
  const pathname = usePathname();

  const moveSelectedTabToTop = (idx: number) => {
    const newTabs = [...propTabs];
    const selectedTab = newTabs.splice(idx, 1);
    newTabs.unshift(selectedTab[0]);
  };
  // const [hovering, setHovering] = useState(false);

  return (
    <div
      className={cn(
        "flex flex-row items-center gap-2 sm:gap-4 justify-center [perspective:1000px] relative overflow-auto sm:overflow-visible no-visible-scrollbar w-full",
        containerClassName
      )}
    >
      {propTabs.map((tab, idx) => {
        const isActive = pathname.includes(`/${tab.value}`);

        return (
          <Link
            href={tab.href}
            key={tab.title}
            onClick={() => {
              moveSelectedTabToTop(idx);
            }}
            // onMouseEnter={() => setHovering(true)}
            // onMouseLeave={() => setHovering(false)}
            className={cn(
              "relative px-3 sm:px-4 py-2 rounded-full",
              tabClassName
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
                  // bg-dark-300 dark:bg-dark-300 inset-0
                  "absolute rounded-full",
                  activeTabClassName
                )}
              />
            )}
            <span
              className={cn(
                `${isActive ? "text-light-900" : "text-light-600"} hover:text-light-900 relative block text-sm w-max`
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

export default Tabs;

export const FadeInDiv = ({
  className,
  tabs,
  hovering,
}: {
  className?: string;
  key?: string;
  tabs: ITab[];
  active: ITab;
  hovering?: boolean;
}) => {
  const pathname = usePathname();

  const isActive = (tab: ITab) => {
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
