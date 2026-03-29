"use client";

import { useRouter } from "next/navigation";
import { Button } from "../ui/button";
import { MessageIcon } from "@/public/assets/svgs";

type Props = {
  userId: string;
  iconOnly?: boolean;
  className?: string;
};

function ChatLauncher({ userId, iconOnly = false, className = "" }: Props) {
  const router = useRouter();

  return (
    <Button
      type="button"
      className={className}
      onClick={() => router.push(`/chat/start/${userId}`)}
    >
      <MessageIcon width="22px" height="22px" />
      {iconOnly ? null : <span className="pl-2">Message</span>}
    </Button>
  );
}

export default ChatLauncher;
