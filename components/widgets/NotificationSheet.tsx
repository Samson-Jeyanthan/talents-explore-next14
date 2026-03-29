"use client";

import {
  getAllNotificationsAction,
  deleteAllNotificationsAction,
  deleteNotificationAction,
  markAllNotificationsAsReadAction,
  markNotificationAsReadAction,
} from "@/actions/notification.action";
import { NotificationCard } from "../cards";
import { NotificationIcon } from "@/public/assets/svgs";
import { Button } from "../ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../ui/alert-dialog";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "../ui/sheet";
import { useUserContext } from "@/context/AuthProvider";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useState, useTransition } from "react";
import { toast } from "sonner";

function NotificationSheet({ data }: { data: any[] }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useUserContext();
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<any[]>(data || []);
  const [pageNumber, setPageNumber] = useState(1);
  const [hasMore, setHasMore] = useState((data || []).length > 0);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [confirmDeleteAll, setConfirmDeleteAll] = useState(false);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    setOpen(false);
  }, [pathname, router]);

  useEffect(() => {
    setNotifications(data || []);
    setPageNumber(1);
    setHasMore((data || []).length > 0);
  }, [data]);

  const unreadCount = useMemo(
    () => notifications.filter((item) => item?.status !== "2").length,
    [notifications]
  );

  const resolveNotificationPath = (notification: any) => {
    const notificationType = notification?.type;
    const notificationKey = notification?.jsonKey;

    if (notificationType === "follow" || notificationKey === "userFollow") {
      const profileId = notification?.senderId || notification?.contentId;
      const username = notification?.senderUserName || "user";
      return profileId ? `/profile/${username}/${profileId}` : null;
    }

    if (notificationType === "profile") {
      return user?.username && user?.currentUserId
        ? `/profile/${user.username}/${user.currentUserId}`
        : "/home";
    }

    if (
      notificationType === "chat" ||
      notificationKey === "chat" ||
      notificationKey === "messageRequest"
    ) {
      const roomId = notification?.contentId || notification?.id;
      return roomId ? `/chat/${roomId}?type=chat` : "/chat";
    }

    if (
      notificationType === "post" ||
      notificationKey === "commentPost" ||
      notificationKey === "ratingPost"
    ) {
      return notification?.contentId ? `/post/${notification.contentId}` : null;
    }

    switch (notificationType) {
      case "profile":
        return user?.username && user?.currentUserId
          ? `/profile/${user.username}/${user.currentUserId}`
          : "/home";
      default:
        return null;
    }
  };

  const handleOpenNotification = async (notification: any) => {
    const path = resolveNotificationPath(notification);

    if (notification?._id && notification?.status !== "2") {
      setNotifications((prev) =>
        prev.map((item) =>
          item._id === notification._id ? { ...item, status: "2" } : item
        )
      );

      startTransition(async () => {
        const res = await markNotificationAsReadAction(notification._id);
        if (!res || res.status !== "7400") {
          toast.error("Couldn't mark notification as read", {
            duration: 4000,
          });
        }
      });
    }

    setOpen(false);

    if (path) {
      window.location.assign(path);
    } else {
      toast.info("This notification type is not available on web yet.", {
        duration: 4000,
      });
    }
  };

  const handleDeleteNotification = async (notificationId: string) => {
    const prev = notifications;
    setNotifications((items) =>
      items.filter((item) => item._id !== notificationId)
    );

    startTransition(async () => {
      const res = await deleteNotificationAction(notificationId);
      if (!res || res.status !== "7400") {
        setNotifications(prev);
        toast.error("Couldn't delete notification", { duration: 4000 });
      }
    });
  };

  const handleMarkAllRead = async () => {
    const prev = notifications;
    setNotifications((items) => items.map((item) => ({ ...item, status: "2" })));

    startTransition(async () => {
      const res = await markAllNotificationsAsReadAction();
      if (!res || res.status !== "7400") {
        setNotifications(prev);
        toast.error("Couldn't mark all notifications as read", {
          duration: 4000,
        });
      }
    });
  };

  const handleDeleteAll = async () => {
    const prev = notifications;
    setNotifications([]);

    startTransition(async () => {
      const res = await deleteAllNotificationsAction();
      if (!res || res.status !== "7400") {
        setNotifications(prev);
        toast.error("Couldn't delete all notifications", { duration: 4000 });
      }
    });
  };

  const confirmDeleteNotification = () => {
    if (!deleteTargetId) {
      return;
    }

    handleDeleteNotification(deleteTargetId);
    setDeleteTargetId(null);
  };

  const handleLoadMore = async () => {
    const nextPage = pageNumber + 1;
    const res = await getAllNotificationsAction(user?.currentUserId, nextPage, 10);

    if (!Array.isArray(res) || res.length === 0) {
      setHasMore(false);
      return;
    }

    setNotifications((prev) => {
      const existingIds = new Set(prev.map((item) => item._id));
      const nextItems = res.filter((item) => !existingIds.has(item._id));
      return [...prev, ...nextItems];
    });
    setPageNumber(nextPage);
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger className="relative z-[110] flex-center size-9 cursor-pointer rounded-full bg-dark-300 fill-light-600 hover:bg-dark-400 hover:fill-light-900 focus:outline-none">
        <NotificationIcon height="20px" width="20px" />
        {unreadCount > 0 ? (
          <span className="absolute -right-1 -top-1 flex min-h-5 min-w-5 items-center justify-center rounded-full bg-primary-500 px-1 text-[10px] font-semibold text-light-900">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        ) : null}
      </SheetTrigger>
      <SheetContent
        className="overflow-y-auto border-none bg-dark-200 text-light-900"
        aria-describedby={undefined}
      >
        <SheetHeader>
          <SheetTitle>Notifications</SheetTitle>
          {notifications.length > 0 ? (
            <div className="flex gap-2 pt-2">
              <Button
                type="button"
                variant="ghost"
                disabled={isPending}
                className="h-8 px-2 text-xs text-light-500 hover:bg-dark-300 hover:text-light-900"
                onClick={handleMarkAllRead}
              >
                Mark All Read
              </Button>
              <Button
                type="button"
                variant="ghost"
                disabled={isPending}
                className="h-8 px-2 text-xs text-light-500 hover:bg-dark-300 hover:text-light-900"
                onClick={() => setConfirmDeleteAll(true)}
              >
                Delete All
              </Button>
            </div>
          ) : null}

          <div className="flex flex-col gap-5 pt-3">
            {notifications.map((item, index) => (
              <NotificationCard
                key={item._id || index}
                notificationCard={item}
                index={index}
                onOpen={handleOpenNotification}
                onDelete={(notificationId) => setDeleteTargetId(notificationId)}
              />
            ))}

            {notifications.length === 0 ? (
              <p className="pt-6 text-sm text-light-500">No notifications found</p>
            ) : null}

            {notifications.length > 0 && hasMore ? (
              <Button
                type="button"
                variant="ghost"
                disabled={isPending}
                className="mt-2 text-sm text-light-500 hover:bg-dark-300 hover:text-light-900"
                onClick={handleLoadMore}
              >
                Load More
              </Button>
            ) : null}
          </div>
        </SheetHeader>
      </SheetContent>

      <AlertDialog
        open={deleteTargetId !== null}
        onOpenChange={(open) => {
          if (!open) {
            setDeleteTargetId(null);
          }
        }}
      >
        <AlertDialogContent className="border-dark-300 bg-dark-200 text-light-900">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Notification?</AlertDialogTitle>
            <AlertDialogDescription className="text-light-500">
              This will permanently remove the selected notification.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-dark-300 bg-dark-250 text-light-900 hover:bg-dark-300">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-primary-500 text-light-900 hover:bg-primary-600"
              onClick={confirmDeleteNotification}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={confirmDeleteAll}
        onOpenChange={(open) => {
          setConfirmDeleteAll(open);
        }}
      >
        <AlertDialogContent className="border-dark-300 bg-dark-200 text-light-900">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete All Notifications?</AlertDialogTitle>
            <AlertDialogDescription className="text-light-500">
              This will permanently remove every notification in your list.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-dark-300 bg-dark-250 text-light-900 hover:bg-dark-300">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-primary-500 text-light-900 hover:bg-primary-600"
              onClick={() => {
                setConfirmDeleteAll(false);
                handleDeleteAll();
              }}
            >
              Delete All
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Sheet>
  );
}

export default NotificationSheet;
