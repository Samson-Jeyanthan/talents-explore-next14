"use client";

import UserProfileImg from "../others/UserProfileImg";
import { CheckCheck, Loader2, Trash2 } from "lucide-react";
import {
  isUnreadNotification,
  notificationTime,
  type NotificationItem,
} from "@/lib/utils/notifications";

interface Props {
  notificationCard: NotificationItem;
  index?: number;
  disabled?: boolean;
  busy?: boolean;
  onOpen: (notification: NotificationItem) => void;
  onDelete: (notificationId: string) => void;
  onMarkRead?: (notificationId: string) => void;
}

export default function NotificationCard({
  notificationCard: item,
  onOpen,
  onDelete,
  onMarkRead,
  disabled,
  busy,
}: Props) {
  const unread = isUnreadNotification(item);
  const sender =
    item.type === "report"
      ? "Talents Explore"
      : `@${item.senderUserName || "notification"}`;
  const time = notificationTime(item);
  return (
    <article
      data-read-state={unread ? "unread" : "read"}
      className={`rounded-xl border border-l-4 p-3 transition-colors ${unread ? "border-primary-500/30 border-l-primary-500 bg-primary-500/5" : "border-dark-400/50 border-l-dark-400 bg-dark-250"}`}
    >
      <div className="flex items-start gap-2">
        <button
          type="button"
          disabled={disabled}
          onClick={() => onOpen(item)}
          aria-label={`${unread ? "Unread" : "Read"} notification from ${sender}: ${item.message || "Open notification"}`}
          className="flex min-w-0 flex-1 items-start gap-3 rounded-md text-left outline-none focus-visible:ring-2 focus-visible:ring-primary-500 disabled:cursor-wait"
        >
          <UserProfileImg
            userName={item.senderUserName || "Talents Explore"}
            src={
              typeof item.senderProfilePicture === "string"
                ? item.senderProfilePicture
                : undefined
            }
            className="!size-10 !min-h-10 !min-w-10"
          />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
              <p
                className={`break-all text-sm text-light-900 ${unread ? "font-semibold" : "font-normal"}`}
              >
                {sender}
              </p>
              {time && <span className="text-xs text-light-500">{time}</span>}
            </div>
            <p
              className={`mt-1 break-words text-sm leading-relaxed ${unread ? "font-medium text-light-900" : "text-light-600"}`}
            >
              {item.message || "Open notification"}
            </p>
          </div>
        </button>
        <button
          type="button"
          disabled={disabled}
          onClick={() => onDelete(item._id)}
          aria-label={`Delete notification from ${sender}`}
          title="Delete notification"
          className="shrink-0 rounded-lg p-2 text-light-500 hover:bg-dark-300 hover:text-primary-500 focus-visible:outline-primary-500 disabled:opacity-50"
        >
          <Trash2 className="size-4" aria-hidden="true" />
        </button>
      </div>
      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 pl-[52px]">
        <span
          className={`flex items-center gap-1.5 text-xs ${unread ? "font-semibold text-primary-500 dark:text-rose-400" : "text-light-500"}`}
        >
          {busy ? (
            <Loader2 className="size-3 animate-spin" aria-hidden="true" />
          ) : unread ? (
            <span
              className="size-1.5 rounded-full bg-primary-500"
              aria-hidden="true"
            />
          ) : (
            <CheckCheck className="size-3.5" aria-hidden="true" />
          )}
          {busy ? "Updating..." : unread ? "Unread" : "Read"}
        </span>
        {unread && onMarkRead && (
          <button
            type="button"
            disabled={disabled}
            onClick={() => onMarkRead(item._id)}
            className="rounded px-1 py-0.5 text-xs font-medium text-light-700 underline-offset-4 hover:underline focus-visible:outline-primary-500 disabled:opacity-50"
          >
            Mark as read
          </button>
        )}
      </div>
    </article>
  );
}
