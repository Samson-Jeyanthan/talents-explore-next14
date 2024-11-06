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
import { INITIAL_USER, useUserContext } from "@/context/AuthProvider";
import { deleteToken } from "@/actions/auth.action";
import { handleClearStorage } from "@/lib/functions/auth.functions";
import { CategoriesSelectionModal } from "../modals";

const LeftSidebar = () => {
  const { setUser } = useUserContext();
  const pathname = usePathname();
  const router = useRouter();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [categoriesOpen, setCategoriesOpen] = useState(false);

  const handleLogoutClick = async () => {
    await deleteToken();
    await handleClearStorage();
    setUser(INITIAL_USER);
    router.push("/sign-in");
  };

  const handleNonLinkClick = (name: string) => {
    if (name === "Upload") {
      setDrawerOpen(true);
    } else if (name === "Categories") {
      setCategoriesOpen(true);
    }
  };

  const handleUploadPageClick = (option: "create-post" | "share") => {
    if (option === "create-post") {
      router.push("/create-post");
    } else if (option === "share") {
      router.push("/share");
    }
    setDrawerOpen(false);
  };

  return (
    <>
      <aside className="sticky inset-y-0 left-0 flex h-screen max-h-screen min-h-screen min-w-60 max-w-60 flex-col items-center justify-between bg-dark-100 py-6 max-lg:min-w-20 max-sm:hidden 2xl:py-8">
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
              const isActive =
                pathname === item.path || pathname.includes(item.path);
              const isUpload =
                (item.name === "Upload" && pathname === "/create-post") ||
                (pathname === "/share" && item.name === "Upload");
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
                      className={`${isUpload ? "bg-dark-250 fill-light-900 text-light-900" : ""} leftsidebar-link w-full `}
                      onClick={() => handleNonLinkClick(item.name)}
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
            <Button
              className="shad-button_primary w-full"
              onClick={() => handleUploadPageClick("create-post")}
            >
              Create Post
            </Button>
            <Button
              className="shad-button_primary w-full"
              onClick={() => handleUploadPageClick("share")}
            >
              Share Anything
            </Button>
          </div>
        </DrawerContent>
      </Drawer>

      <CategoriesSelectionModal
        isOpen={categoriesOpen}
        onClose={() => setCategoriesOpen(false)}
      />
    </>
  );
};

export default LeftSidebar;
