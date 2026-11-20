"use client";

import NotificationCard from "../cards/NotificationCard";
import { NotificationIcon } from "@/public/assets/svgs";
import { Button } from "../ui/button";
import { RefreshCw, Bell } from "lucide-react";
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
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useNotificationInbox } from "@/lib/hooks/useNotificationInbox";
import {
  isUnreadNotification,
  notificationPath,
  type NotificationItem,
  type NotificationPage,
} from "@/lib/utils/notifications";

export default function NotificationSheet({
  data,
}: {
  data: NotificationPage;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useUserContext();
  const [open, setOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ id?: string } | null>(
    null,
  );
  const inbox = useNotificationInbox(data);
  const busy = inbox.loading || !!inbox.pending;
  const unread = inbox.items.filter(isUnreadNotification).length;
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  async function handleOpen(item: NotificationItem) {
    if (isUnreadNotification(item) && !(await inbox.mutate("read", item._id)))
      return;
    const path = notificationPath(item, user);
    if (path) {
      setOpen(false);
      router.push(path);
    } else
      toast.info("This notification has no linked page. You can read it here.");
  }

  return (
    <Sheet
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (next) inbox.load(true);
      }}
    >
      <SheetTrigger
        aria-label={`Notifications, ${unread} unread in loaded notifications`}
        className="flex-center relative z-[110] size-9 cursor-pointer rounded-full bg-dark-300 fill-light-600 hover:bg-dark-400 hover:fill-light-900 focus-visible:outline-primary-500"
      >
        <NotificationIcon height="20px" width="20px" />
        {unread > 0 && (
          <span
            aria-hidden="true"
            className="absolute -right-1 -top-1 flex min-h-5 min-w-5 items-center justify-center rounded-full bg-primary-500 px-1 text-[10px] font-semibold text-white"
          >
            {unread > 99 ? "99+" : unread}
          </span>
        )}
      </SheetTrigger>
      <SheetContent
        className="flex w-full flex-col gap-4 border-dark-400 bg-dark-200 p-4 text-light-900 sm:max-w-lg sm:p-6"
        aria-describedby={undefined}
      >
        <SheetHeader className="shrink-0 pr-8 text-left">
          <SheetTitle className="text-xl text-light-900">
            Notifications
          </SheetTitle>
          <p aria-live="polite" className="text-xs text-light-500">
            {inbox.loadError && !inbox.items.length
              ? "Unable to check unread notifications"
              : unread
                ? `${unread} unread in this list`
                : "No unread notifications in this list"}
          </p>
          <div className="flex flex-wrap items-center gap-2 pt-2">
            <Button
              type="button"
              variant="ghost"
              disabled={busy}
              onClick={() => inbox.load(true)}
              className="h-8 gap-1.5 px-2 text-xs text-light-700"
            >
              <RefreshCw
                aria-hidden="true"
                className={`size-3.5 ${inbox.loading ? "animate-spin" : ""}`}
              />
              Refresh
            </Button>
            {inbox.items.length > 0 && (
              <>
                <Button
                  type="button"
                  variant="ghost"
                  disabled={busy}
                  onClick={() => inbox.mutate("readAll")}
                  className="h-8 px-2 text-xs text-light-700"
                >
                  Mark all read
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  disabled={busy}
                  onClick={() => setDeleteTarget({})}
                  className="h-8 px-2 text-xs text-light-700"
                >
                  Delete all
                </Button>
              </>
            )}
          </div>
        </SheetHeader>
        <div
          className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto pb-4"
          aria-busy={busy}
        >
          {inbox.writeError && !deleteTarget && (
            <p
              role="alert"
              className="rounded-lg border border-primary-500/30 p-3 text-sm text-primary-500"
            >
              {inbox.writeError} Try the action again.
            </p>
          )}
          {inbox.items.map((item, index) => (
            <NotificationCard
              key={item._id}
              notificationCard={item}
              index={index}
              disabled={busy}
              busy={inbox.pending === item._id}
              onOpen={handleOpen}
              onMarkRead={(id) => inbox.mutate("read", id)}
              onDelete={(id) => setDeleteTarget({ id })}
            />
          ))}
          {inbox.loading && (
            <p
              role="status"
              className="py-3 text-center text-sm text-light-500"
            >
              Loading notifications...
            </p>
          )}
          {inbox.pending && (
            <p role="status" className="text-center text-xs text-light-500">
              Updating notifications...
            </p>
          )}
          {inbox.loadError && (
            <div
              role="alert"
              className="rounded-xl border border-primary-500/30 p-4 text-sm text-light-700"
            >
              <p>{inbox.loadError}</p>
              <Button
                type="button"
                disabled={busy}
                onClick={() => inbox.load()}
                className="shad-button_secondary mt-3"
              >
                Try again
              </Button>
            </div>
          )}
          {!inbox.loading && !inbox.loadError && !inbox.items.length && (
            <div className="flex flex-col items-center gap-3 py-16 text-center">
              <Bell className="size-8 text-light-500" aria-hidden="true" />
              <p className="text-sm font-medium text-light-900">
                No notifications yet
              </p>
              <p className="max-w-xs text-xs leading-relaxed text-light-500">
                New activity on your posts, profile and collaborations will
                appear here.
              </p>
            </div>
          )}
          {inbox.hasMore && !inbox.loadError && (
            <Button
              type="button"
              variant="ghost"
              disabled={busy}
              onClick={() => inbox.load()}
              className="shad-button_secondary mt-2"
            >
              Load more notifications
            </Button>
          )}
        </div>
      </SheetContent>
      <AlertDialog
        open={deleteTarget !== null}
        onOpenChange={(next) => {
          if (!next && !busy) setDeleteTarget(null);
        }}
      >
        <AlertDialogContent className="max-w-[calc(100vw-2rem)] rounded-2xl border-dark-400 bg-dark-250 text-light-900 sm:max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle>
              {deleteTarget?.id
                ? "Delete notification?"
                : "Delete all notifications?"}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-light-600">
              {deleteTarget?.id
                ? "This will permanently remove the selected notification."
                : "This will permanently remove all your notifications, including any not loaded in this list."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          {inbox.writeError && (
            <p role="alert" className="text-sm text-primary-500">
              {inbox.writeError}
            </p>
          )}
          <AlertDialogFooter>
            <AlertDialogCancel
              disabled={busy}
              className="shad-button_secondary"
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              disabled={busy}
              className="shad-button_primary"
              onClick={async (event) => {
                event.preventDefault();
                const success = await inbox.mutate(
                  deleteTarget?.id ? "delete" : "deleteAll",
                  deleteTarget?.id,
                );
                if (success) setDeleteTarget(null);
              }}
            >
              {inbox.pending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Sheet>
  );
}
