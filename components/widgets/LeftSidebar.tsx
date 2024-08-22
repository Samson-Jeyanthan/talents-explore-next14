"use client";

import React from "react";
import { usePathname } from "next/navigation";
import { SIDEBAR_ITEMS } from "@/constants";
import Image from "next/image";
import Link from "next/link";
import { AiOutlineLogout } from "react-icons/ai";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "../ui/drawer";
import { Button } from "../ui/button";
import { deleteSession } from "@/lib/session";

const LeftSidebar = () => {
  const pathname = usePathname();

  const handleLogout = () => {
    deleteSession();
    localStorage.clear();
  };
  return (
    <Drawer>
      <aside className="lg:flex-between sticky top-0 hidden h-screen min-w-64 flex-col bg-dark-100 py-8">
        <div className="flex-center w-full flex-col gap-8">
          <Image
            src="/assets/images/te-logo-expanded-light.png"
            alt="TE-Logo"
            width={200}
            height={30}
            className="h-auto w-[70%] object-contain"
          />
          <ul className="flex w-full flex-col gap-4 p-3">
            {SIDEBAR_ITEMS.map((item, index) => {
              const isActive = item.isLink
                ? pathname === item.path || pathname.includes(item.path)
                : pathname === "/create-post" || pathname === "share";
              return (
                <li key={index}>
                  {item.isLink ? (
                    <Link
                      href={item.path}
                      className={`${isActive ? "bg-dark-250 fill-light-900 text-light-900" : ""} leftsidebar-link w-full `}
                    >
                      <item.icon width="20px" height="20px" />
                      {item.name}
                    </Link>
                  ) : (
                    <DrawerTrigger
                      className={`${isActive ? "bg-dark-250 fill-light-900 text-light-900" : ""} leftsidebar-link w-full `}
                    >
                      <item.icon width="20px" height="20px" />
                      {item.name}
                    </DrawerTrigger>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
        <div
          className="leftsidebar-link flex-center w-[90%] border border-solid border-dark-250"
          onClick={handleLogout}
        >
          <AiOutlineLogout className="text-lg" />
          Logout
        </div>
      </aside>

      <DrawerContent className="flex-start h-2/5 gap-6 border-none bg-dark-200">
        <DrawerHeader>
          <DrawerTitle>Are you absolutely sure?</DrawerTitle>
          <DrawerDescription>This action cannot be undone.</DrawerDescription>
        </DrawerHeader>
        <div className="flex w-72 flex-col gap-6">
          <Button className="shad-button_primary w-full">Create Post</Button>
          <Button className="shad-button_primary w-full">Share Anything</Button>
        </div>
      </DrawerContent>
    </Drawer>
  );
};

export default LeftSidebar;
