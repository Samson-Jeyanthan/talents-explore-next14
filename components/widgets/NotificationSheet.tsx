"use client";

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetOverlay,
  SheetTitle,
  SheetTrigger,
} from "../ui/sheet";
import { NotificationIcon } from "@/public/assets/svgs";
import { NotificationCard } from "../cards";
import { useState } from "react";

function NotificationSheet({ data }: { data: any }) {
  const [open, setOpen] = useState(false);
  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger className="flex-center z-[110] size-9 cursor-pointer rounded-full bg-dark-300 fill-light-600 hover:bg-dark-400 hover:fill-light-900 focus:outline-none">
        <NotificationIcon height="20px" width="20px" />
      </SheetTrigger>
      <SheetOverlay />
      <SheetContent
        className="overflow-y-auto border-none bg-dark-200 text-light-900"
        aria-describedby={undefined}
      >
        <SheetHeader>
          <SheetTitle>Notifications</SheetTitle>
          <div className="flex flex-col gap-4">
            {data.length > 0 &&
              data?.map((item: any, index: number) => (
                <NotificationCard
                  key={index}
                  notificationCard={item}
                  index={index}
                  onClick={() => setOpen(false)}
                />
              ))}
          </div>
        </SheetHeader>
      </SheetContent>
    </Sheet>
  );
}

export default NotificationSheet;
