"use client";

import UserProfileImg from "../others/UserProfileImg";
import { BsDot } from "react-icons/bs";
import { Button } from "../ui/button";

interface Props {
  notificationCard: any;
  index: number;
  onOpen: (notification: any) => void;
  onDelete: (notificationId: string) => void;
}

const NotificationCard = ({
  notificationCard,
  onOpen,
  onDelete,
}: Props) => {
  return (
    <article
      className={`relative flex gap-3 rounded-[12px] border-2 p-3 ${
        notificationCard?.status === "2"
          ? "border-dark-300 bg-dark-250"
          : "border-primary-500/40 bg-dark-250/90"
      }`}
    >
      <button
        type="button"
        className="flex w-full items-start gap-3 text-left"
        onClick={() => onOpen(notificationCard)}
      >
        <UserProfileImg
          userName={notificationCard?.senderUserName || "te-user"}
          src={notificationCard?.senderProfilePicture}
          userId={notificationCard?.senderId}
        />

        <div className="flex w-full items-start justify-between gap-3">
          <div className="flex flex-col gap-[2px]">
            <div className="flex items-center gap-1">
              <p className="text-sm font-medium text-light-900">
                {notificationCard?.type === "report"
                  ? "Talents Explore"
                  : `@${notificationCard?.senderUserName || "notification"}`}
              </p>
              <p className="flex items-center justify-start text-[11px] text-light-500">
                <BsDot className="text-xs" />
                {notificationCard?.timeAgo} ago
              </p>
            </div>

            <p className="text-xs text-light-500">
              {notificationCard?.message || "Open notification"}
            </p>
          </div>

          {notificationCard?.status !== "2" ? (
            <span className="mt-1 size-2 rounded-full bg-primary-500" />
          ) : null}
        </div>
      </button>

      <Button
        type="button"
        variant="ghost"
        className="absolute right-2 top-2 h-7 px-2 text-xs text-light-500 hover:bg-dark-300 hover:text-light-900"
        onClick={() => onDelete(notificationCard._id)}
      >
        Delete
      </Button>
    </article>
  );
};

export default NotificationCard;
