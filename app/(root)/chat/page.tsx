import {
  getChatRoomsAction,
  getChatUnreadCountAction,
  getGroupChatRoomsAction,
} from "@/actions/chat.action";
import ChatDashboard from "@/components/widgets/chat/ChatDashboard";
import { readSharedPost } from "@/lib/utils/postSharing";
import { getCurrentAccountAccessAction } from "@/actions/account-access.action";

export const dynamic = "force-dynamic";

export default async function ChatPage({
  searchParams = {},
}: {
  searchParams?: Record<string, string | string[] | undefined>;
}) {
  const account = await getCurrentAccountAccessAction();
  const [initialChats, initialRequests, initialGroups, unreadCount] =
    await Promise.all([
      getChatRoomsAction("chat", 1, 10),
      getChatRoomsAction("request", 1, 10),
      account.isTalent ? getGroupChatRoomsAction(1, 10) : Promise.resolve([]),
      getChatUnreadCountAction(),
    ]);

  return (
    <ChatDashboard
      key={account._id}
      accountId={account._id}
      isTalent={account.isTalent}
      initialChats={initialChats}
      initialRequests={initialRequests}
      initialGroups={initialGroups}
      initialUnreadCount={unreadCount}
      sharedPost={readSharedPost(searchParams)}
    />
  );
}
