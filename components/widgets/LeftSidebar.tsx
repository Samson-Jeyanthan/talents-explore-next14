"use client";

import React from "react";
import { usePathname } from "next/navigation";
import { SIDEBAR_ITEMS } from "@/constants";
import Image from "next/image";
import Link from "next/link";
import { AiOutlineLogout } from "react-icons/ai";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "../ui/drawer";

const LeftSidebar = () => {
  const pathname = usePathname();
  return (
    <>
      <aside className="flex-between w-72 flex-col bg-dark-100 py-8">
        <div className="flex-center w-full flex-col gap-8">
          <Image
            src="/assets/images/te-logo-expanded-light.png"
            alt="TE-Logo"
            width={200}
            height={30}
            className="h-auto w-3/4 object-contain"
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
                    <div
                      className={`${isActive ? "bg-dark-250 fill-light-900 text-light-900" : ""} leftsidebar-link w-full `}
                    >
                      <item.icon width="20px" height="20px" />
                      {item.name}
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
        <div className="leftsidebar-link flex-center w-[90%] border border-solid border-dark-250">
          <AiOutlineLogout className="text-lg" />
          Logout
        </div>
      </aside>

      {/* <Drawer>
        <DrawerTrigger>Open</DrawerTrigger>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>Are you absolutely sure?</DrawerTitle>
            <DrawerDescription>This action cannot be undone.</DrawerDescription>
          </DrawerHeader>
          <DrawerFooter>hi</DrawerFooter>
        </DrawerContent>
      </Drawer> */}
    </>
  );
};

export default LeftSidebar;
