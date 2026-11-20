export interface NotificationItem {
  _id: string;
  status?: string | number;
  type?: string;
  jsonKey?: string;
  senderId?: string;
  senderUserName?: string;
  senderProfilePicture?: string;
  contentId?: string;
  roomId?: string;
  postId?: string;
  parentPostId?: string;
  content?: { postId?: string };
  id?: string;
  message?: string;
  timeAgo?: string;
  [key: string]: unknown;
}

export type NotificationPage =
  | { success: true; data: NotificationItem[]; hasMore?: boolean }
  | { success: false; message: string };

export function isNotificationId(value: unknown): value is string {
  return typeof value === "string" && /^[a-f\d]{24}$/i.test(value);
}

// Mobile Notifications.getUnreadCount uses status 2 for unread (number or string).
export function isUnreadNotification(item: NotificationItem) {
  return String(item.status) === "2";
}

export function normalizeNotifications(
  value: unknown,
): NotificationItem[] | null {
  if (
    !Array.isArray(value) ||
    value.some((item) => !item || !isNotificationId(item._id))
  )
    return null;
  const seen = new Set<string>();
  return value.filter((item) => {
    if (seen.has(item._id)) return false;
    seen.add(item._id);
    return true;
  });
}

export function isCommentNotification(item: NotificationItem) {
  if (
    /comment/i.test(String(item.type || "")) ||
    /comment/i.test(String(item.jsonKey || ""))
  )
    return true;
  return (
    item.type === "post" &&
    [
      "action",
      "event",
      "subType",
      "notificationType",
      "activityType",
      "title",
      "message",
    ].some(
      (field) =>
        typeof item[field] === "string" &&
        /comment/i.test(item[field] as string),
    )
  );
}

export function notificationPath(
  item: NotificationItem,
  viewer?: { currentUserId?: string; username?: string } | null,
) {
  const type = item.type;
  const key = item.jsonKey;
  if (type === "follow" || key === "userFollow") {
    const id = item.contentId || item.senderId;
    return isNotificationId(id)
      ? `/profile/${encodeURIComponent(item.senderUserName || "user")}/${id}`
      : null;
  }
  if (type === "profile") {
    return isNotificationId(viewer?.currentUserId) && viewer?.username
      ? `/profile/${encodeURIComponent(viewer.username)}/${viewer.currentUserId}`
      : null;
  }
  if (type === "chat" || key === "chat" || key === "messageRequest") {
    const id = item.roomId || item.contentId || item.id;
    return isNotificationId(id)
      ? `/chat/${id}?type=${key === "messageRequest" ? "request" : "chat"}`
      : null;
  }
  if (type === "collaboration")
    return isNotificationId(item.contentId)
      ? `/collaboration/${item.contentId}`
      : null;
  if (type === "post" || isCommentNotification(item) || key === "ratingPost") {
    const id =
      item.postId ??
      item.parentPostId ??
      item.content?.postId ??
      item.contentId ??
      item.id;
    return isNotificationId(id)
      ? `/post/${id}${isCommentNotification(item) ? "#comments" : ""}`
      : null;
  }
  return null;
}

export function notificationTime(item: NotificationItem) {
  const value = typeof item.timeAgo === "string" ? item.timeAgo.trim() : "";
  return !value || /ago$|^just now$|^now$/i.test(value)
    ? value
    : `${value} ago`;
}
