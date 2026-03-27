"use client";

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "../ui/sheet";
import { NotificationIcon } from "@/public/assets/svgs";
import { NotificationCard } from "../cards";
import { useEffect, useState } from "react";
import { isToday, isYesterday, isThisWeek, subDays } from "date-fns";
import { usePathname, useRouter } from "next/navigation";

function NotificationSheet({ data }: { data: any[] }) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setOpen(false);
  }, [pathname, router]);

  const groupedNotifications = {
    today: [],
    yesterday: [],
    thisWeek: [],
    last30Days: [],
    older: [],
  };

  data?.forEach((item) => {
    const createdOn = new Date(item.createdOn);

    if (isToday(createdOn)) {
      groupedNotifications.today.push(item);
    } else if (isYesterday(createdOn)) {
      groupedNotifications.yesterday.push(item);
    } else if (isThisWeek(createdOn, { weekStartsOn: 1 })) {
      // Week starts on Monday
      groupedNotifications.thisWeek.push(item);
    } else if (subDays(createdOn, 30) !== undefined) {
      groupedNotifications.last30Days.push(item);
    } else {
      groupedNotifications.older.push(item);
    }
  });

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger className="flex-center z-[110] size-9 cursor-pointer rounded-full bg-dark-300 fill-light-600 hover:bg-dark-400 hover:fill-light-900 focus:outline-none">
        <NotificationIcon height="20px" width="20px" />
      </SheetTrigger>
      <SheetContent
        className="overflow-y-auto border-none bg-dark-200 text-light-900"
        aria-describedby={undefined}
      >
        <SheetHeader>
          <SheetTitle>Notifications</SheetTitle>
          <div className="flex flex-col gap-5">
            {groupedNotifications.today.length > 0 && (
              <div className="flex flex-col gap-2">
                <h2 className="border-t border-dark-300 pb-1 pt-2 text-base font-medium">
                  Today
                </h2>
                {groupedNotifications.today.map((item, index) => (
                  <NotificationCard
                    key={index}
                    notificationCard={item}
                    index={index}
                    onClick={() => setOpen(false)}
                  />
                ))}
              </div>
            )}
            {groupedNotifications.last30Days.length > 0 && (
              <div className="flex flex-col gap-2">
                <h2 className="border-t border-dark-300 pb-1 pt-2 text-base font-medium">
                  Last 30 Days
                </h2>
                {groupedNotifications.last30Days.map((item, index) => (
                  <NotificationCard
                    key={index}
                    notificationCard={item}
                    index={index}
                    onClick={() => setOpen(false)}
                  />
                ))}
              </div>
            )}
          </div>
        </SheetHeader>
      </SheetContent>
    </Sheet>
  );
}

export default NotificationSheet;
