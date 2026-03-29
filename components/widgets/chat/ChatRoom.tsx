"use client";

import {
  acceptChatRequestAction,
  deleteChatMessageAction,
  deleteConversationAction,
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
import { useUserContext } from "@/context/AuthProvider";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { ArrowLeft, MoreVertical, Send, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { io, type Socket } from "socket.io-client";
import { toast } from "sonner";

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
};

const RECENT_CHATS_KEY = "te-web-recent-chats";
const RECENT_GROUPS_KEY = "te-web-recent-groups";

function persistRecentRoom(key: string, room: Record<string, any>, roomLimit = 25) {
  if (typeof window === "undefined") {
    return;
  }

  try {
    const stored = window.localStorage.getItem(key);
    const parsed = stored ? JSON.parse(stored) : [];
    const current = Array.isArray(parsed) ? parsed : [];
    const filtered = current.filter(
      (item: any) => (item?._id || item?.roomId) !== (room?._id || room?.roomId)
    );
    const next = [room, ...filtered].slice(0, roomLimit);
    window.localStorage.setItem(key, JSON.stringify(next));
  } catch {
    // ignore localStorage errors
  }
}

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
}: Props) {
  const router = useRouter();
  const { user } = useUserContext();
  const [messages, setMessages] = useState<any[]>(initialMessages || []);
  const [members, setMembers] = useState<any[]>(initialMembers || []);
  const [chatInfo, setChatInfo] = useState<any>(initialChatInfo || null);
  const [message, setMessage] = useState("");
  const [typing, setTyping] = useState<any>(null);
  const [isLoadingOlder, setIsLoadingOlder] = useState(false);
  const [deleteMessageId, setDeleteMessageId] = useState<string | null>(null);
  const [confirmDeleteConversation, setConfirmDeleteConversation] =
    useState(false);
  const [isPending, startTransition] = useTransition();
  const listRef = useRef<HTMLDivElement>(null);
  const socketRef = useRef<Socket | null>(null);

  const activeUserId = currentUser?._id || user.currentUserId;
  const activeUserName = currentUser?.userName || user.username;
  const sender = useMemo(
    () => members.find((member) => member?.userId !== activeUserId),
    [members, activeUserId]
  );
  const selfMember = useMemo(
    () => members.find((member) => member?.userId === activeUserId),
    [members, activeUserId]
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

  useEffect(() => {
    if (!roomId) {
      return;
    }

    const latestMessage = [...messages].reverse().find((item) => !item?.type);
    const roomPayload =
      initialType === "group"
        ? {
            _id: initialGroupChatDetails?._id || roomId,
            roomId,
            title: initialGroupChatDetails?.title || "Group chat",
            collaboration: initialGroupChatDetails || null,
            lastMessage: latestMessage?.content || "Open conversation",
            updatedAt: latestMessage?.createdAt || new Date().toISOString(),
            unread: 0,
          }
        : {
            _id: chatInfo?._id || roomId,
            roomId,
            member: sender
              ? [
                  {
                    userId: sender.userId,
                    userName: sender.userName,
                    userProfilePicture: sender.userProfilePicture,
                    professional: sender.professional,
                  },
                ]
              : [],
            info: chatInfo || null,
            lastMessage: latestMessage?.content || "Open conversation",
            updatedAt: latestMessage?.createdAt || new Date().toISOString(),
            unread: 0,
          };

    persistRecentRoom(
      initialType === "group" ? RECENT_GROUPS_KEY : RECENT_CHATS_KEY,
      roomPayload
    );
  }, [roomId, initialType, initialGroupChatDetails, chatInfo, sender, messages]);

  useEffect(() => {
    const container = listRef.current;
    if (container) {
      container.scrollTop = container.scrollHeight;
    }
  }, []);

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
      socket.emit("join", { roomId, userId: activeUserId });
    });

    socket.on("newMessage", (data: any) => {
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
      if (Array.isArray(data?.members)) {
        setMembers(data.members);
      }
    });

    socket.on("typing", (data: any) => {
      setTyping(data?.isTyping ? data : null);
    });

    return () => {
      socket.emit("leave", { roomId, userId: activeUserId });
      socket.disconnect();
    };
  }, [activeUserId, roomId]);

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
        direction: "up",
        id: firstMessageId,
        pageSize: 10,
      });

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
    const memberRes = await getChatMembersAction(roomId);
    setMembers(memberRes?.list || []);
    setChatInfo(memberRes?.info || null);
  };

  const handleSendMessage = () => {
    const trimmed = message.trim();

    if (!trimmed) {
      return;
    }

    setMessage("");
    emitTyping(false);

    startTransition(async () => {
      const res = await sendChatMessageAction({
        roomId,
        content: trimmed,
        colorCode: selfMember?.colorCode || null,
      });

      if (!res || res.status !== "7400") {
        toast.error("Couldn't send message", { duration: 4000 });
        setMessage(trimmed);
        return;
      }

      const latest = await getChatMessagesAction({
        roomId,
        id: messages[messages.length - 1]?._id || null,
        direction: "down",
        pageSize: 10,
      });

      if (Array.isArray(latest) && latest.length > 0) {
        setMessages((prev) => {
          const ids = new Set(prev.map((item) => item?._id));
          const next = latest.filter((item) => !ids.has(item?._id));
          return next.length > 0 ? [...prev, ...next] : prev;
        });
      }

      persistRecentRoom(
        initialType === "group" ? RECENT_GROUPS_KEY : RECENT_CHATS_KEY,
        initialType === "group"
          ? {
              _id: initialGroupChatDetails?._id || roomId,
              roomId,
              title: initialGroupChatDetails?.title || "Group chat",
              collaboration: initialGroupChatDetails || null,
              lastMessage: trimmed,
              updatedAt: new Date().toISOString(),
              unread: 0,
            }
          : {
              _id: chatInfo?._id || roomId,
              roomId,
              member: sender
                ? [
                    {
                      userId: sender.userId,
                      userName: sender.userName,
                      userProfilePicture: sender.userProfilePicture,
                      professional: sender.professional,
                    },
                  ]
                : [],
              info: chatInfo || null,
              lastMessage: trimmed,
              updatedAt: new Date().toISOString(),
              unread: 0,
            }
      );
    });
  };

  const handleDeleteMessage = () => {
    if (!deleteMessageId) {
      return;
    }

    startTransition(async () => {
      const res = await deleteChatMessageAction(roomId, deleteMessageId);

      if (!res || res.status !== "7400") {
        toast.error("Couldn't delete message", { duration: 4000 });
        return;
      }

      setMessages((prev) =>
        prev.filter((item) => item?._id !== deleteMessageId)
      );
      setDeleteMessageId(null);
    });
  };

  const handleDeleteConversation = () => {
    startTransition(async () => {
      const res = await deleteConversationAction(roomId);

      if (!res || res.status !== "7400") {
        toast.error("Couldn't delete conversation", { duration: 4000 });
        return;
      }

      router.push("/chat");
    });
  };

  const handleAcceptRequest = () => {
    if (!chatInfo?._id) {
      return;
    }

    startTransition(async () => {
      const res = await acceptChatRequestAction(chatInfo._id);

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
      <div className="flex h-[calc(100vh-3.5rem)] w-full max-w-6xl flex-col px-4 py-4 text-light-900 sm:px-6">
        <div className="flex items-center justify-between rounded-t-[28px] border border-dark-300 bg-dark-250 px-4 py-4">
          <div className="flex min-w-0 items-center gap-3">
            <Button
              type="button"
              className="rounded-full bg-dark-200 px-3 text-light-900 hover:bg-dark-300"
              onClick={() => router.push("/chat")}
            >
              <ArrowLeft className="size-4" />
            </Button>

            <div className="min-w-0">
              {initialType === "group" ? (
                <p className="truncate text-base font-semibold">{title}</p>
              ) : sender?.userId ? (
                <Link
                  href={`/profile/${sender?.userName || "user"}/${sender.userId}`}
                  className="truncate text-base font-semibold hover:text-primary-500"
                >
                  {title}
                </Link>
              ) : (
                <p className="truncate text-base font-semibold">{title}</p>
              )}

              <p className="truncate text-xs text-light-500">{subtitle}</p>
            </div>
          </div>

          <Button
            type="button"
            className="rounded-full bg-dark-200 px-3 text-light-500 hover:bg-dark-300 hover:text-light-900"
            onClick={() => setConfirmDeleteConversation(true)}
          >
            <MoreVertical className="size-4" />
          </Button>
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

          <div ref={listRef} className="flex-1 overflow-y-auto px-4 py-4">
            <div className="flex flex-col gap-3">
              {messages.length === 0 ? (
                <div className="rounded-[22px] border border-dashed border-dark-300 bg-dark-250 px-4 py-10 text-center text-sm text-light-500">
                  No chat history found
                </div>
              ) : null}

              {messages.map((item, index) => {
                if (item?.type === "date") {
                  return (
                    <div key={`date-${item?._id || index}`} className="py-2 text-center text-xs text-light-500">
                      {formatMessageDate(item?.dateGroup)}
                    </div>
                  );
                }

                if (item?.type === "join" || item?.isLeft || item?.isDeleted) {
                  const statusText = item?.type === "join"
                    ? `${item?.name || item?.userName} joined`
                    : item?.isLeft
                      ? `${item?.name || item?.userName} left`
                      : `${item?.name || item?.userName} removed`;

                  return (
                    <div key={item?._id || index} className="py-1 text-center text-xs italic text-light-500">
                      {statusText}
                    </div>
                  );
                }

                const isOwn = item?.userId === activeUserId;

                return (
                  <div
                    key={item?._id || index}
                    className={cn("flex", isOwn ? "justify-end" : "justify-start")}
                  >
                    <div
                      className={cn(
                        "max-w-[85%] rounded-[22px] px-4 py-3 shadow-sm",
                        isOwn
                          ? "bg-light-900 text-dark-200"
                          : "bg-dark-250 text-light-900"
                      )}
                    >
                      {item?.media ? (
                        <a
                          href={item.media}
                          target="_blank"
                          rel="noreferrer"
                          className="mb-2 block overflow-hidden rounded-[16px] border border-dark-300"
                        >
                          {item?.mediaType === "image" ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={item.media}
                              alt="Chat media"
                              className="max-h-80 w-full object-cover"
                            />
                          ) : (
                            <div className="px-4 py-10 text-center text-xs text-light-500">
                              Open attached {item?.mediaType || "media"}
                            </div>
                          )}
                        </a>
                      ) : null}

                      {item?.content ? (
                        <p className="whitespace-pre-wrap break-words text-sm">
                          {item.content}
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
            <div className="border-t border-dark-300 bg-dark-250 p-4">
              <div className="flex items-end gap-3">
                <textarea
                  value={message}
                  onChange={(event) => {
                    setMessage(event.target.value);
                    emitTyping(Boolean(event.target.value.trim()));
                  }}
                  onBlur={() => emitTyping(false)}
                  placeholder="Type a message"
                  rows={1}
                  className="min-h-12 flex-1 resize-none rounded-[22px] border border-dark-300 bg-dark-200 px-4 py-3 text-sm text-light-900 outline-none placeholder:text-light-500 focus:border-primary-500"
                />
                <Button
                  type="button"
                  disabled={isPending || !message.trim()}
                  className="rounded-full bg-primary-500 px-4 text-light-900 hover:bg-primary-600"
                  onClick={handleSendMessage}
                >
                  <Send className="mr-2 size-4" />
                  Send
                </Button>
              </div>
            </div>
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
                className="mt-3 rounded-full bg-primary-500 px-5 text-light-900 hover:bg-primary-600"
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
              className="bg-primary-500 text-light-900 hover:bg-primary-600"
              onClick={handleDeleteMessage}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={confirmDeleteConversation}
        onOpenChange={setConfirmDeleteConversation}
      >
        <AlertDialogContent className="border-dark-300 bg-dark-200 text-light-900">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Conversation?</AlertDialogTitle>
            <AlertDialogDescription className="text-light-500">
              This removes the conversation from your chat history.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-dark-300 bg-dark-250 text-light-900 hover:bg-dark-300">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-primary-500 text-light-900 hover:bg-primary-600"
              onClick={handleDeleteConversation}
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
