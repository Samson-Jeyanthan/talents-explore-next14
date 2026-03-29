"use client";

import UserProfileImg from "@/components/others/UserProfileImg";
import { Button } from "@/components/ui/button";
import { formatDistanceToNowStrict } from "date-fns";
import { Inbox, MessageSquare, Search, Users } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState, useTransition } from "react";

type TabKey = "chat" | "request" | "group";

type ChatUnreadCount = {
  oneToOne: number;
  group: number;
  request: number;
};

type Props = {
  initialChats: any[];
  initialRequests: any[];
  initialGroups: any[];
  initialUnreadCount: ChatUnreadCount;
};

type ChatRoomsApiResult = {
  rooms?: any[];
  debug?: {
    tab?: string;
    status?: string | number | null;
    message?: string | null;
    normalizedCount?: number;
    responseType?: string;
    reason?: string;
  };
};

const PAGE_SIZE = 10;
const RECENT_CHATS_KEY = "te-web-recent-chats";
const RECENT_GROUPS_KEY = "te-web-recent-groups";

function readRecentChatsStorage(key: string) {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const stored = window.localStorage.getItem(key);
    const parsed = stored ? JSON.parse(stored) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function mergeRoomsByKey(primary: any[], fallback: any[]) {
  const merged = [...primary];
  const ids = new Set(primary.map((room) => room?._id || room?.roomId));

  fallback.forEach((room) => {
    const key = room?._id || room?.roomId;
    if (key && !ids.has(key)) {
      merged.push(room);
    }
  });

  return merged;
}

function formatTimeAgo(value?: string) {
  if (!value) {
    return "";
  }

  try {
    return formatDistanceToNowStrict(new Date(value), { addSuffix: true });
  } catch {
    return "";
  }
}

function sumUnread(rooms: any[]) {
  return rooms.reduce((total, room) => total + Number(room?.unread || 0), 0);
}

function ChatDashboard({
  initialChats,
  initialRequests,
  initialGroups,
  initialUnreadCount,
}: Props) {
  const [activeTab, setActiveTab] = useState<TabKey>("chat");
  const [searchKey, setSearchKey] = useState("");
  const [chatRooms, setChatRooms] = useState(initialChats || []);
  const [requestRooms, setRequestRooms] = useState(initialRequests || []);
  const [groupRooms, setGroupRooms] = useState(initialGroups || []);
  const [pages, setPages] = useState({ chat: 1, request: 1, group: 1 });
  const [hasMore, setHasMore] = useState({
    chat: (initialChats || []).length >= PAGE_SIZE,
    request: (initialRequests || []).length >= PAGE_SIZE,
    group: (initialGroups || []).length >= PAGE_SIZE,
  });
  const [debugState, setDebugState] = useState<Record<string, any>>({});
  const [isPending, startTransition] = useTransition();

  const fetchRooms = async (tab: TabKey, pageNumber = 1) => {
    const response = await fetch(
      `/api/chat/rooms?tab=${tab}&pageNumber=${pageNumber}&pageSize=${PAGE_SIZE}`,
      {
        method: "GET",
        cache: "no-store",
      }
    );

    const data = (await response.json()) as ChatRoomsApiResult;

    setDebugState((prev) => ({
      ...prev,
      [tab]: data?.debug || null,
    }));

    return Array.isArray(data?.rooms) ? data.rooms : [];
  };

  useEffect(() => {
    const recentChats = readRecentChatsStorage(RECENT_CHATS_KEY);
    const recentGroups = readRecentChatsStorage(RECENT_GROUPS_KEY);

    if (recentChats.length > 0) {
      setChatRooms((prev) => mergeRoomsByKey(prev, recentChats));
    }

    if (recentGroups.length > 0) {
      setGroupRooms((prev) => mergeRoomsByKey(prev, recentGroups));
    }

    startTransition(async () => {
      const [latestChats, latestRequests, latestGroups] = await Promise.all([
        fetchRooms("chat", 1),
        fetchRooms("request", 1),
        fetchRooms("group", 1),
      ]);

      if (Array.isArray(latestChats)) {
        setChatRooms((prev) => mergeRoomsByKey(latestChats, prev));
        setHasMore((prev) => ({ ...prev, chat: latestChats.length >= PAGE_SIZE }));
      }

      if (Array.isArray(latestRequests)) {
        setRequestRooms(latestRequests);
        setHasMore((prev) => ({
          ...prev,
          request: latestRequests.length >= PAGE_SIZE,
        }));
      }

      if (Array.isArray(latestGroups)) {
        setGroupRooms((prev) => mergeRoomsByKey(latestGroups, prev));
        setHasMore((prev) => ({ ...prev, group: latestGroups.length >= PAGE_SIZE }));
      }

      setPages({ chat: 1, request: 1, group: 1 });
    });
  }, []);

  const activeData = useMemo(() => {
    const rooms =
      activeTab === "chat"
        ? chatRooms
        : activeTab === "request"
          ? requestRooms
          : groupRooms;

    if (!searchKey.trim()) {
      return rooms;
    }

    const filter = searchKey.toLowerCase();

    return rooms.filter((room) => {
      const title =
        room?.member?.[0]?.userName ||
        room?.collaboration?.title ||
        room?.title ||
        "";
      const subtitle = room?.lastMessage || room?.info?.message || "";

      return (
        title.toLowerCase().includes(filter) ||
        subtitle.toLowerCase().includes(filter)
      );
    });
  }, [activeTab, chatRooms, requestRooms, groupRooms, searchKey]);

  const activeRawCount =
    activeTab === "chat"
      ? chatRooms.length
      : activeTab === "request"
        ? requestRooms.length
        : groupRooms.length;
  const visibleUnreadCount = {
    oneToOne: sumUnread(chatRooms),
    request: sumUnread(requestRooms),
    group: sumUnread(groupRooms),
  };

  const markRoomAsRead = (roomId: string, tab: TabKey) => {
    const updater = (room: any) =>
      room.roomId === roomId ? { ...room, unread: 0 } : room;

    if (tab === "chat") {
      setChatRooms((prev) => prev.map(updater));
      return;
    }

    if (tab === "request") {
      setRequestRooms((prev) => prev.map(updater));
      return;
    }

    setGroupRooms((prev) => prev.map(updater));
  };

  const handleLoadMore = () => {
    startTransition(async () => {
      const nextPage = pages[activeTab] + 1;
      const nextRooms =
        await fetchRooms(activeTab, nextPage);

      if (!Array.isArray(nextRooms) || nextRooms.length === 0) {
        setHasMore((prev) => ({ ...prev, [activeTab]: false }));
        return;
      }

      const mergeRooms = (current: any[]) => {
        const ids = new Set(current.map((room) => room._id || room.roomId));
        const merged = [...current];

        nextRooms.forEach((room) => {
          const key = room._id || room.roomId;
          if (!ids.has(key)) {
            merged.push(room);
          }
        });

        return merged;
      };

      if (activeTab === "chat") {
        setChatRooms((prev) => mergeRooms(prev));
      } else if (activeTab === "request") {
        setRequestRooms((prev) => mergeRooms(prev));
      } else {
        setGroupRooms((prev) => mergeRooms(prev));
      }

      setPages((prev) => ({ ...prev, [activeTab]: nextPage }));
      setHasMore((prev) => ({
        ...prev,
        [activeTab]: nextRooms.length >= PAGE_SIZE,
      }));
    });
  };

  return (
    <div className="flex w-full max-w-6xl flex-col gap-5 px-4 py-6 text-light-900 sm:px-6">
      <div className="rounded-[28px] border border-dark-300 bg-dark-250 p-4 sm:p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold">Chat</h1>
            <p className="text-sm text-light-500">
              Messages, requests, and collaboration groups in one place.
            </p>
          </div>

          <div className="relative w-full sm:max-w-sm">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-light-500" />
            <input
              value={searchKey}
              onChange={(event) => setSearchKey(event.target.value)}
              placeholder="Search conversations"
              className="h-11 w-full rounded-full border border-dark-300 bg-dark-200 pl-10 pr-4 text-sm text-light-900 outline-none placeholder:text-light-500 focus:border-primary-500"
            />
          </div>
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          <Button
            type="button"
            className={`${activeTab === "chat" ? "bg-primary-500 text-light-900" : "bg-dark-200 text-light-500"} rounded-full px-4 hover:text-light-900`}
            onClick={() => setActiveTab("chat")}
          >
            <MessageSquare className="mr-2 size-4" />
            Messages
            {visibleUnreadCount.oneToOne > 0 ? (
              <span className="ml-2 rounded-full bg-dark-100 px-2 py-0.5 text-[10px] text-light-900">
                {visibleUnreadCount.oneToOne}
              </span>
            ) : null}
          </Button>

          <Button
            type="button"
            className={`${activeTab === "request" ? "bg-primary-500 text-light-900" : "bg-dark-200 text-light-500"} rounded-full px-4 hover:text-light-900`}
            onClick={() => setActiveTab("request")}
          >
            <Inbox className="mr-2 size-4" />
            Requests
            {visibleUnreadCount.request > 0 ? (
              <span className="ml-2 rounded-full bg-dark-100 px-2 py-0.5 text-[10px] text-light-900">
                {visibleUnreadCount.request}
              </span>
            ) : null}
          </Button>

          <Button
            type="button"
            className={`${activeTab === "group" ? "bg-primary-500 text-light-900" : "bg-dark-200 text-light-500"} rounded-full px-4 hover:text-light-900`}
            onClick={() => setActiveTab("group")}
          >
            <Users className="mr-2 size-4" />
            Groups
            {visibleUnreadCount.group > 0 ? (
              <span className="ml-2 rounded-full bg-dark-100 px-2 py-0.5 text-[10px] text-light-900">
                {visibleUnreadCount.group}
              </span>
            ) : null}
          </Button>
        </div>
      </div>

      <div className="rounded-[28px] border border-dark-300 bg-dark-250 p-3 sm:p-4">
        <div className="flex flex-col gap-3">
          {activeData.map((room) => {
            const member = room?.member?.[0];
            const unreadValue = Number(room?.unread || 0);
            const isUnread = unreadValue > 0;
            const isGroupTab = activeTab === "group";
            const isRequestTab = activeTab === "request";
            const title =
              member?.userName || room?.collaboration?.title || room?.title || "Chat";
            const subtitle =
              room?.lastMessage ||
              (activeTab === "request"
                ? room?.info?.message || "Open request"
                : "Open conversation");
            const avatarSrc =
              member?.userProfilePicture ||
              room?.collaboration?.poster?.thumbnailUrl ||
              room?.collaboration?.poster?.url ||
              null;
            const avatarUserId = member?.userId || room?.collaboration?._id || room?._id;
            const href = `/chat/${room.roomId}?type=${activeTab}`;
            const accentClass = isGroupTab
              ? isUnread
                ? "bg-[#22c55e]"
                : "bg-[#22c55e]/50"
              : isRequestTab
                ? isUnread
                  ? "bg-[#f59e0b]"
                  : "bg-[#f59e0b]/50"
                : isUnread
                  ? "bg-primary-500"
                  : "bg-primary-500/50";
            const cardClass = isGroupTab
              ? isUnread
                ? "border-[#22c55e]/40 bg-[rgba(34,197,94,0.08)]"
                : "border-dark-300 bg-[rgba(34,197,94,0.03)] hover:border-[#22c55e]/40 hover:bg-[rgba(34,197,94,0.06)]"
              : isRequestTab
                ? isUnread
                  ? "border-[#f59e0b]/40 bg-[rgba(245,158,11,0.08)]"
                  : "border-dark-300 bg-[rgba(245,158,11,0.03)] hover:border-[#f59e0b]/40 hover:bg-[rgba(245,158,11,0.06)]"
                : isUnread
                  ? "border-primary-500/40 bg-[rgba(234,49,72,0.08)]"
                  : "border-dark-300 bg-dark-200 hover:border-primary-500/50 hover:bg-dark-300";
            const typePillClass = isGroupTab
              ? "bg-[rgba(34,197,94,0.12)] text-[#4ade80]"
              : isRequestTab
                ? "bg-[rgba(245,158,11,0.12)] text-[#fbbf24]"
                : "bg-[rgba(234,49,72,0.12)] text-[#ff7a8f]";
            const timeClass = isGroupTab
              ? isUnread
                ? "text-[#4ade80]"
                : "text-light-500"
              : isRequestTab
                ? isUnread
                  ? "text-[#fbbf24]"
                  : "text-light-500"
                : isUnread
                  ? "text-primary-500"
                  : "text-light-500";
            const typeLabel = isGroupTab
              ? "Group"
              : isRequestTab
                ? "Request"
                : "Message";

            return (
              <Link
                key={room._id || room.roomId}
                href={href}
                className={`flex items-center gap-3 rounded-[22px] border p-3 transition ${cardClass}`}
                onClick={() => {
                  markRoomAsRead(room.roomId, activeTab);
                }}
              >
                {isUnread ? (
                  <span className={`h-12 w-1 rounded-full ${accentClass}`} />
                ) : null}

                <UserProfileImg
                  userName={title}
                  src={avatarSrc}
                  userId={avatarUserId}
                />

                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p
                          className={`truncate text-sm ${
                            isUnread
                              ? "font-semibold text-light-900"
                              : "font-medium text-light-900"
                          }`}
                        >
                          {title}
                        </p>
                        <span
                          className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] ${typePillClass}`}
                        >
                          {typeLabel}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {room?.updatedAt || room?.createdAt ? (
                        <span className={`text-[11px] ${timeClass}`}>
                          {formatTimeAgo(room?.updatedAt || room?.createdAt)}
                        </span>
                      ) : null}
                      {isUnread ? (
                        <span className={`flex min-h-5 min-w-5 items-center justify-center rounded-full px-1 text-[10px] font-semibold text-light-900 ${accentClass}`}>
                          {unreadValue}
                        </span>
                      ) : null}
                    </div>
                  </div>

                  <p
                    className={`truncate pt-1 text-xs ${
                      isUnread
                        ? "font-medium text-[rgba(255,255,255,0.82)]"
                        : "text-light-500"
                    }`}
                  >
                    {subtitle}
                  </p>
                </div>
              </Link>
            );
          })}

          {activeData.length === 0 ? (
            <div className="rounded-[22px] border border-dashed border-dark-300 bg-dark-200 px-4 py-10 text-center">
              <p className="text-sm text-light-500">
                {searchKey
                  ? "No conversations match your search."
                  : activeTab === "request"
                    ? "No message requests found."
                    : activeTab === "group"
                      ? "No group chats found."
                    : "No chat history found."}
              </p>
              <p className="pt-3 text-xs text-light-500/80">
                Debug: tab=`{activeTab}` visible=`{activeData.length}` raw=`{activeRawCount}`
              </p>
              {debugState?.[activeTab] ? (
                <p className="pt-2 text-xs text-light-500/70">
                  API: status=`{String(debugState[activeTab]?.status ?? "null")}` type=`
                  {debugState[activeTab]?.responseType || "unknown"}` count=`
                  {String(debugState[activeTab]?.normalizedCount ?? 0)}` msg=`
                  {debugState[activeTab]?.message || debugState[activeTab]?.reason || "-"}`
                </p>
              ) : null}
            </div>
          ) : null}

          {activeData.length > 0 && hasMore[activeTab] ? (
            <Button
              type="button"
              disabled={isPending}
              className="mt-2 rounded-full bg-dark-200 text-light-500 hover:text-light-900"
              onClick={handleLoadMore}
            >
              {isPending ? "Loading..." : "Load More"}
            </Button>
          ) : null}
        </div>
      </div>
    </div>
  );
}

export default ChatDashboard;
