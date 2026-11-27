"use client";
import LinkedText from "@/components/others/LinkedText";

import {
  acceptChatRequestAction,
  deleteChatMessageAction,
  getChatMembersAction,
  getChatMessagesAction,
  sendChatMessageAction,
} from "@/actions/chat.action";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { ArrowLeft, Trash2 } from "lucide-react";
import ChatComposer from "./ChatComposer";
import ChatMessageMedia from "./ChatMessageMedia";
import type { ChatMessageInput } from "@/lib/validations/chat.validation";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { io, type Socket } from "socket.io-client";
import { toast } from "sonner";
import type { SharedPost } from "@/lib/utils/postSharing";
import { chatEntityId, chatCollaborationHref } from "@/lib/utils/chat-header";
import ChatHeaderActions from "./ChatHeaderActions";

type CurrentUser = {
  _id: string;
  userName: string;
  profileImage: string | null;
  professional: string;
};

type Props = {
  roomId: string;
  initialType: "chat" | "request" | "group";
  initialMessages: any[];
  initialMembers: any[];
  initialChatInfo: any;
  initialGroupChatDetails: any;
  currentUser: CurrentUser | null;
  sharedPost?: SharedPost;
};

function formatMessageTime(value?: string) {
  if (!value) {
    return "";
  }

  try {
    return format(new Date(value), "hh:mma");
  } catch {
    return "";
  }
}

function formatMessageDate(value?: string) {
  if (!value) {
    return "";
  }

  try {
    return format(new Date(value), "dd MMM yyyy");
  } catch {
    return "";
  }
}

function getSocketEndpoint() {
  return (
    process.env.NEXT_PUBLIC_BACKEND_URL?.replace(/\/api$/, "") ||
    "https://api.talentsexplore.com"
  );
}

function ChatRoom({
  roomId,
  initialType,
  initialMessages,
  initialMembers,
  initialChatInfo,
  initialGroupChatDetails,
  currentUser,
  sharedPost,
}: Props) {
  const router = useRouter();
  const [messages, setMessages] = useState<any[]>(initialMessages || []);
  const [members, setMembers] = useState<any[]>(initialMembers || []);
  const [chatInfo, setChatInfo] = useState<any>(initialChatInfo || null);
  const [typing, setTyping] = useState<any>(null);
  const [isLoadingOlder, setIsLoadingOlder] = useState(false);
  const [deleteMessageId, setDeleteMessageId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const listRef = useRef<HTMLDivElement>(null);
  const socketRef = useRef<Socket | null>(null);
  const activeUserId = currentUser?._id || "";
  const activeUserName = currentUser?.userName || "";
  const sessionKey = `${activeUserId}:${roomId}`;
  const activeRoom = useRef(sessionKey);
  activeRoom.current = sessionKey;
  useEffect(() => {
    activeRoom.current = sessionKey;
    return () => {
      activeRoom.current = "";
    };
  }, [sessionKey]);
  const sender = useMemo(
    () =>
      members.find((member) => {
        const id = chatEntityId(member?.userId);
        return id && id !== chatEntityId(activeUserId);
      }),
    [members, activeUserId],
  );
  const selfMember = useMemo(
    () =>
      members.find(
        (member) => chatEntityId(member?.userId) === chatEntityId(activeUserId),
      ),
    [members, activeUserId],
  );

  const isRequestInviteSent =
    chatInfo?.type === "REQUEST" &&
    messages.filter((item) => !item?.type).length > 0 &&
    chatInfo?.requestedBy === activeUserId;

  const isRequestAccept =
    chatInfo?.type === "REQUEST" && chatInfo?.requestedBy !== activeUserId;

  const title =
    initialType === "group"
      ? initialGroupChatDetails?.title || "Group chat"
      : sender?.userName || "Chat";

  const subtitle =
    typing?.isTyping && typing?.userId !== activeUserId
      ? "typing..."
      : initialType === "group"
        ? `${members.length} ${members.length === 1 ? "member" : "members"}`
        : sender?.professional || chatInfo?.type || "";

  const recipientId = chatEntityId(sender?.userId);
  const headerHref =
    initialType === "group"
      ? chatCollaborationHref(initialGroupChatDetails)
      : recipientId
        ? `/profile/${encodeURIComponent(sender?.userName || "user")}/${recipientId}`
        : null;
  const headerContent = (
    <>
      <p className="truncate text-base font-semibold">{title}</p>
      <p className="truncate text-xs text-light-500">{subtitle}</p>
    </>
  );

  useEffect(() => {
    setMessages(initialMessages || []);
    setMembers(initialMembers || []);
    setChatInfo(initialChatInfo || null);
  }, [roomId, initialMessages, initialMembers, initialChatInfo]);

  useEffect(() => {
    const container = listRef.current;
    if (container) {
      container.scrollTop = container.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    if (!activeUserId || !roomId) {
      return;
    }

    const socket = io(`${getSocketEndpoint()}/stream`, {
      timeout: 1000000,
      transports: ["websocket"],
      reconnectionAttempts: 500,
    });

    socketRef.current = socket;

    socket.on("connect", () => {
      if (activeRoom.current !== sessionKey) return;
      socket.emit("join", { roomId, userId: activeUserId });
    });

    socket.on("newMessage", (data: any) => {
      if (
        activeRoom.current !== sessionKey ||
        (data?.roomId && data.roomId !== roomId)
      )
        return;
      setMessages((prev) => {
        if (prev.some((item) => item?._id === data?._id)) {
          return prev;
        }

        return [...prev, data];
      });

      requestAnimationFrame(() => {
        const container = listRef.current;
        if (container) {
          container.scrollTop = container.scrollHeight;
        }
      });
    });

    socket.on("onlineUsers", (data: any) => {
      if (activeRoom.current !== sessionKey) return;
      if (Array.isArray(data?.members)) {
        setMembers(data.members);
      }
    });

    socket.on("typing", (data: any) => {
      if (activeRoom.current !== sessionKey) return;
      setTyping(data?.isTyping ? data : null);
    });

    return () => {
      socket.emit("leave", { roomId, userId: activeUserId });
      socket.disconnect();
      if (socketRef.current === socket) socketRef.current = null;
    };
  }, [activeUserId, roomId, sessionKey]);

  const emitTyping = (isTyping: boolean) => {
    socketRef.current?.emit("typing", {
      roomId,
      userId: activeUserId,
      userName: activeUserName,
      isTyping,
    });
  };

  const loadOlderMessages = () => {
    const firstMessageId = messages.find((item) => !item?.type)?._id;

    if (!firstMessageId) {
      return;
    }

    setIsLoadingOlder(true);

    startTransition(async () => {
      const older = await getChatMessagesAction({
        roomId,
        expectedViewerId: activeUserId,
        direction: "up",
        id: firstMessageId,
        pageSize: 10,
      });
      if (activeRoom.current !== sessionKey) return;

      if (Array.isArray(older) && older.length > 0) {
        const prepared = [...older].reverse();
        setMessages((prev) => {
          const ids = new Set(prev.map((item) => item?._id));
          const next = prepared.filter((item) => !ids.has(item?._id));
          return [...next, ...prev];
        });
      }

      setIsLoadingOlder(false);
    });
  };

  const refreshChatMeta = async () => {
    const memberRes = await getChatMembersAction(roomId, activeUserId);
    if (activeRoom.current !== sessionKey) return;
    setMembers(memberRes?.list || []);
    setChatInfo(memberRes?.info || null);
  };

  const handleSendMessage = async (payload: ChatMessageInput) => {
    if (activeRoom.current !== sessionKey)
      return {
        success: false,
        message: "Your chat session changed. Reload chat to continue.",
      };
    const res = await sendChatMessageAction(
      {
        ...payload,
        roomId,
        colorCode: selfMember?.colorCode || null,
      },
      activeUserId,
    );
    if (!res || res.status !== "7400")
      return {
        success: false,
        message:
          res?.message || "Unable to send your message. Please try again.",
      };
    if (activeRoom.current !== sessionKey) return { success: true };

    const result = res.response?.message || res.response?.data || res.response;
    if (result && typeof result === "object" && result._id) {
      const saved = {
        ...payload,
        userId: activeUserId,
        userName: activeUserName,
        createdAt: new Date().toISOString(),
        ...result,
      };
      setMessages((prev) =>
        prev.some((item) => item?._id === saved._id)
          ? prev.map((item) =>
              item?._id === saved._id ? { ...item, ...saved } : item,
            )
          : [...prev, saved],
      );
    }

    // The backend has acknowledged the send. A failed list refresh must not
    // turn it into a retryable send failure and produce a duplicate message.
    try {
      const latest = await getChatMessagesAction({
        roomId,
        expectedViewerId: activeUserId,
        id: messages[messages.length - 1]?._id || null,
        direction: "down",
        pageSize: 10,
      });
      if (
        activeRoom.current === sessionKey &&
        Array.isArray(latest) &&
        latest.length
      ) {
        setMessages((prev) => {
          const ids = new Set(prev.map((item) => item?._id));
          return [...prev, ...latest.filter((item) => !ids.has(item?._id))];
        });
      }
      if (
        (!result || typeof result !== "object" || !result._id) &&
        !latest.length
      )
        router.refresh();
    } catch {
      /* Sending succeeded; realtime updates or refresh can reload it. */
    }

    if (activeRoom.current !== sessionKey) return { success: true };
    return { success: true };
  };

  const handleDeleteMessage = () => {
    if (!deleteMessageId) {
      return;
    }

    startTransition(async () => {
      const res = await deleteChatMessageAction(
        roomId,
        deleteMessageId,
        activeUserId,
      );
      if (activeRoom.current !== sessionKey) return;

      if (!res || res.status !== "7400") {
        toast.error("Couldn't delete message", { duration: 4000 });
        return;
      }

      setMessages((prev) =>
        prev.filter((item) => item?._id !== deleteMessageId),
      );
      setDeleteMessageId(null);
    });
  };

  const handleAcceptRequest = () => {
    if (!chatInfo?._id) {
      return;
    }

    startTransition(async () => {
      const res = await acceptChatRequestAction(chatInfo._id, activeUserId);
      if (activeRoom.current !== sessionKey) return;

      if (!res || res.status !== "7400") {
        toast.error("Couldn't accept request", { duration: 4000 });
        return;
      }

      await refreshChatMeta();
      toast.success("Message request accepted", { duration: 3000 });
    });
  };

  return (
    <>
      <div className="flex h-[calc(100vh-3.5rem)] w-full max-w-6xl flex-col p-4 text-light-900 sm:px-6">
        <div className="flex items-center justify-between rounded-t-[28px] border border-dark-300 bg-dark-250 p-4">
          <div className="flex min-w-0 items-center gap-3">
            <Button
              type="button"
              aria-label="Back to conversations"
              className="rounded-full bg-dark-200 px-3 text-light-900 hover:bg-dark-300"
              onClick={() => router.push("/chat")}
            >
              <ArrowLeft className="size-4" />
            </Button>

            {headerHref ? (
              <Link
                href={headerHref}
                aria-label={
                  initialType === "group"
                    ? `Open collaboration: ${title}`
                    : `Open profile: ${title}`
                }
                className="block min-w-0 hover:text-primary-500"
              >
                {headerContent}
              </Link>
            ) : (
              <div className="min-w-0">{headerContent}</div>
            )}
          </div>

          <ChatHeaderActions
            key={`${roomId}:${initialType}:${recipientId || "none"}`}
            roomId={roomId}
            type={initialType}
            activeUserId={activeUserId}
            recipientId={recipientId}
          />
        </div>

        <div className="flex flex-1 flex-col overflow-hidden rounded-b-[28px] border border-t-0 border-dark-300 bg-dark-200">
          {initialType === "group" && initialGroupChatDetails?.title ? (
            <div className="border-b border-dark-300 px-4 py-3 text-sm text-light-500">
              Welcome to the collaboration group{" "}
              <span className="font-medium text-light-900">
                {initialGroupChatDetails.title}
              </span>
              . This space is for general communication.
            </div>
          ) : null}

          <div className="border-b border-dark-300 px-4 py-3">
            <Button
              type="button"
              disabled={isLoadingOlder || isPending}
              className="rounded-full bg-dark-250 text-light-500 hover:text-light-900"
              onClick={loadOlderMessages}
            >
              {isLoadingOlder ? "Loading..." : "Load older messages"}
            </Button>
          </div>

          <div ref={listRef} className="flex-1 overflow-y-auto p-4">
            <div className="flex flex-col gap-3">
              {messages.length === 0 ? (
                <div className="rounded-[22px] border border-dashed border-dark-300 bg-dark-250 px-4 py-10 text-center text-sm text-light-500">
                  No chat history found
                </div>
              ) : null}

              {messages.map((item, index) => {
                if (item?.type === "date") {
                  return (
                    <div
                      key={`date-${item?._id || index}`}
                      className="py-2 text-center text-xs text-light-500"
                    >
                      {formatMessageDate(item?.dateGroup)}
                    </div>
                  );
                }

                if (item?.type === "join" || item?.isLeft || item?.isDeleted) {
                  const statusText =
                    item?.type === "join"
                      ? `${item?.name || item?.userName} joined`
                      : item?.isLeft
                        ? `${item?.name || item?.userName} left`
                        : `${item?.name || item?.userName} removed`;

                  return (
                    <div
                      key={item?._id || index}
                      className="py-1 text-center text-xs italic text-light-500"
                    >
                      {statusText}
                    </div>
                  );
                }

                const isOwn = item?.userId === activeUserId;

                return (
                  <div
                    key={item?._id || index}
                    className={cn(
                      "flex",
                      isOwn ? "justify-end" : "justify-start",
                    )}
                  >
                    <div
                      className={cn(
                        "max-w-[85%] rounded-[22px] px-4 py-3 shadow-sm",
                        isOwn
                          ? "bg-light-900 text-dark-200"
                          : "bg-dark-250 text-light-900",
                      )}
                    >
                      {item?.media ? (
                        <ChatMessageMedia
                          media={item.media}
                          mediaType={item.mediaType}
                          videoThumbnail={item.videoThumbnail}
                        />
                      ) : null}

                      {item?.content ? (
                        <p className="whitespace-pre-wrap break-words text-sm">
                          <LinkedText text={item.content} inverted={isOwn} />
                        </p>
                      ) : null}

                      <div className="mt-2 flex items-center justify-end gap-2 text-[11px] opacity-70">
                        <span>{formatMessageTime(item?.createdAt)}</span>
                        {isOwn ? (
                          <button
                            type="button"
                            className="inline-flex items-center"
                            onClick={() => setDeleteMessageId(item?._id)}
                          >
                            <Trash2 className="size-3.5" />
                          </button>
                        ) : null}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {!isRequestInviteSent && !isRequestAccept ? (
            <ChatComposer
              key={roomId}
              roomId={roomId}
              sharedPost={sharedPost}
              userName={activeUserName}
              onTyping={emitTyping}
              onSend={handleSendMessage}
            />
          ) : null}

          {isRequestInviteSent ? (
            <div className="border-t border-dark-300 bg-dark-250 px-4 py-5 text-center">
              <p className="text-sm font-medium text-light-900">Invite sent</p>
              <p className="pt-1 text-xs text-light-500">
                You can send more messages after your invite is accepted.
              </p>
            </div>
          ) : null}

          {isRequestAccept ? (
            <div className="border-t border-dark-300 bg-dark-250 px-4 py-5 text-center">
              <p className="text-sm text-light-500">
                Accept message request from{" "}
                <span className="font-medium text-light-900">
                  {sender?.userName || "this user"}
                </span>
                ?
              </p>
              <Button
                type="button"
                disabled={isPending}
                className="mt-3 rounded-full bg-primary-500 px-5 text-light-900 hover:bg-primary-500"
                onClick={handleAcceptRequest}
              >
                {isPending ? "Accepting..." : "Accept"}
              </Button>
            </div>
          ) : null}
        </div>
      </div>

      <AlertDialog
        open={deleteMessageId !== null}
        onOpenChange={(open) => {
          if (!open) {
            setDeleteMessageId(null);
          }
        }}
      >
        <AlertDialogContent className="border-dark-300 bg-dark-200 text-light-900">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Message?</AlertDialogTitle>
            <AlertDialogDescription className="text-light-500">
              This message will be removed from the conversation.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-dark-300 bg-dark-250 text-light-900 hover:bg-dark-300">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-primary-500 text-light-900"
              onClick={handleDeleteMessage}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

export default ChatRoom;
