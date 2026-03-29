"use client";

import Link from "next/link";
import { MessageIcon } from "@/public/assets/svgs";

function ChatNavButton({ unreadCount }: { unreadCount: number }) {
  return (
    <Link
      href="/chat"
      className="relative z-[110] flex-center size-9 cursor-pointer rounded-full bg-dark-300 fill-light-600 hover:bg-dark-400 hover:fill-light-900"
    >
      <MessageIcon height="18px" width="18px" />
      {unreadCount > 0 ? (
        <span className="absolute -right-1 -top-1 flex min-h-5 min-w-5 items-center justify-center rounded-full bg-primary-500 px-1 text-[10px] font-semibold text-light-900">
          {unreadCount > 99 ? "99+" : unreadCount}
        </span>
      ) : null}
    </Link>
  );
}

export default ChatNavButton;
