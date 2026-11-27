export function clearLegacyChatStorage() {
  for (const key of ["te-web-recent-chats", "te-web-recent-groups"]) {
    try {
      if (typeof window !== "undefined") window.localStorage?.removeItem(key);
    } catch {
      /* Storage may be blocked. Old entries are never read or migrated. */
    }
  }
}

export class ChatSessionChangedError extends Error {
  name = "ChatSessionChangedError";
}

export async function fetchAccountChatRooms(
  accountId: string,
  tab: "chat" | "request" | "group",
  pageNumber: number,
  pageSize: number,
  signal: AbortSignal,
) {
  const query = new URLSearchParams({
    tab,
    pageNumber: String(pageNumber),
    pageSize: String(pageSize),
    viewerId: accountId,
  });
  const response = await fetch(`/api/chat/rooms?${query}`, {
    cache: "no-store",
    signal,
  });
  const data = await response.json();
  if (signal.aborted) throw new Error("Request cancelled.");
  if (data?.viewerId !== accountId)
    throw new ChatSessionChangedError(
      "Your account changed. Reload chat to continue.",
    );
  if (!response.ok || !Array.isArray(data?.rooms))
    throw new Error("Unable to load conversations. Please try again.");
  return data.rooms as any[];
}
