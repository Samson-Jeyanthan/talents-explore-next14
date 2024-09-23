import React from "react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetOverlay,
  SheetTitle,
  SheetTrigger,
} from "../ui/sheet";
import { NotificationIcon } from "@/public/assets/svgs";
import { cn } from "@/lib/utils";

function NotificationSheet() {
  return (
    <Sheet open={false}>
      <SheetTrigger className="flex-center z-[110] size-9 cursor-pointer rounded-full bg-dark-300 fill-light-600 hover:bg-dark-400 hover:fill-light-900 focus:outline-none">
        <NotificationIcon height="20px" width="20px" />
      </SheetTrigger>
      <SheetOverlay className={cn("bg-black/10 backdrop-blur-sm")} />
      <SheetContent className="border-none bg-dark-200 text-light-900">
        <SheetHeader>
          <SheetTitle>Notifications</SheetTitle>
          <SheetDescription>
            This action cannot be undone. This will permanently delete your
            account and remove your data from our servers.
          </SheetDescription>
        </SheetHeader>
      </SheetContent>
    </Sheet>
  );
}

export default NotificationSheet;
