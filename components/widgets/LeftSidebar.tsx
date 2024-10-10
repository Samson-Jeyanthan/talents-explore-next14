"use client";

import React, { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
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
} from "../ui/drawer";
import { Button } from "../ui/button";
import { handleLogout } from "@/lib/functions/auth.functions";
import { useUserContext } from "@/context/AuthProvider";

const LeftSidebar = () => {
  const { setUser } = useUserContext();
  const pathname = usePathname();
  const router = useRouter();
  const [drawerOpen, setDrawerOpen] = useState(false);

  const handleLogoutClick = async () => {
    await handleLogout();
    setUser({
      currentUserId: "",
      email: "",
      username: "",
      firstName: "",
      imageUrl: "",
      isTalent: false,
      lastName: "",
    });
    router.push("/sign-in");
  };

  return (
    <>
      <aside className="sticky left-0 top-0 flex max-h-screen min-h-screen min-w-60 max-w-60 flex-col items-center justify-between bg-dark-100 py-6 max-lg:min-w-20 max-sm:hidden 2xl:py-8">
        <div className="flex-center w-full flex-col gap-5 2xl:gap-8">
          <Image
            src="/assets/images/te-logo-expanded-light.png"
            alt="TE-Logo"
            width={200}
            height={30}
            className="h-auto w-4/6 object-contain max-lg:hidden 2xl:w-[70%]"
          />
          <ul className="flex w-full flex-col gap-2 p-3 2xl:gap-3">
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
                      <item.icon width="19px" height="19px" />
                      <p className="max-lg:hidden">{item.name}</p>
                    </Link>
                  ) : (
                    <div
                      className={`${isActive ? "bg-dark-250 fill-light-900 text-light-900" : ""} leftsidebar-link w-full `}
                      onClick={() => setDrawerOpen(true)}
                    >
                      <item.icon width="19px" height="19px" />
                      <p className="max-lg:hidden">{item.name}</p>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        </div>

        <div className="flex-center w-full p-2">
          <Button
            className="leftsidebar-link flex-center w-auto border border-solid border-dark-250 lg:w-[90%]"
            onClick={handleLogoutClick}
          >
            <AiOutlineLogout className="text-lg" />
            <p className="max-lg:hidden">Logout</p>
          </Button>
        </div>
      </aside>

      <Drawer open={drawerOpen} onOpenChange={setDrawerOpen}>
        <DrawerContent className="flex-start h-2/5 gap-6 border-none bg-dark-200">
          <DrawerHeader>
            <DrawerTitle>Are you absolutely sure?</DrawerTitle>
            <DrawerDescription>This action cannot be undone.</DrawerDescription>
          </DrawerHeader>
          <div className="flex w-72 flex-col gap-6">
            <Button className="shad-button_primary w-full">Create Post</Button>
            <Button className="shad-button_primary w-full">
              Share Anything
            </Button>
          </div>
        </DrawerContent>
      </Drawer>
    </>
  );
};

export default LeftSidebar;
