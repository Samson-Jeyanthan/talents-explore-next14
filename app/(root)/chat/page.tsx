import {
  getChatRoomsAction,
  getChatUnreadCountAction,
  getGroupChatRoomsAction,
} from "@/actions/chat.action";
import ChatDashboard from "@/components/widgets/chat/ChatDashboard";
import { readSharedPost } from "@/lib/utils/postSharing";

export const dynamic = "force-dynamic";

export default async function ChatPage({
  searchParams = {},
}: {
  searchParams?: Record<string, string | string[] | undefined>;
}) {
  const [initialChats, initialRequests, initialGroups, unreadCount] =
    await Promise.all([
      getChatRoomsAction("chat", 1, 10),
      getChatRoomsAction("request", 1, 10),
      getGroupChatRoomsAction(1, 10),
      getChatUnreadCountAction(),
    ]);

  return (
    <ChatDashboard
      initialChats={initialChats}
      initialRequests={initialRequests}
      initialGroups={initialGroups}
      initialUnreadCount={unreadCount}
      sharedPost={readSharedPost(searchParams)}
    />
  );
}
