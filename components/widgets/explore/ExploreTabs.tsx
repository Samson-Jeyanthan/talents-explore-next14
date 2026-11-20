"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { exploreTabHref } from "@/lib/utils/explore";

export default function ExploreTabs() {
  const pathname = usePathname();
  const params = useSearchParams();
  const tabs = [
    ["All", "/explore"],
    ["Posts", "/explore/posts"],
    ["Talents", "/explore/talents"],
    ["Shared", "/explore/shared"],
  ];
  return (
    <nav
      aria-label="Explore content types"
      className="relative z-20 flex w-full flex-wrap items-center justify-center gap-1 p-2"
    >
      {tabs.map(([label, href]) => (
        <Link
          key={href}
          href={exploreTabHref(href, params.toString())}
          scroll={false}
          aria-current={pathname === href ? "page" : undefined}
          className={`rounded-full px-3 py-2 text-sm ${pathname === href ? "bg-dark-250 font-semibold text-light-900" : "text-light-700 hover:bg-dark-250/60"}`}
        >
          {label}
        </Link>
      ))}
    </nav>
  );
}
