import {
  getChatMembersAction,
  getChatMessagesAction,
  getCurrentChatUserAction,
  getGroupChatRoomDetailsAction,
} from "@/actions/chat.action";
import ChatRoom from "@/components/widgets/chat/ChatRoom";
import { readSharedPost } from "@/lib/utils/postSharing";

type Props = {
  params: {
    roomId: string;
  };
  searchParams: {
    type?: "chat" | "request" | "group";
    sharePost?: string;
    shareTitle?: string;
  };
};

export default async function ChatRoomPage({ params, searchParams }: Props) {
  const type = searchParams?.type || "chat";

  const [currentUser, messages, membersRes, groupChatDetails] =
    await Promise.all([
      getCurrentChatUserAction(),
      getChatMessagesAction({
        roomId: params.roomId,
        direction: "down",
        pageSize: 10,
      }),
      getChatMembersAction(params.roomId),
      type === "group" ? getGroupChatRoomDetailsAction(params.roomId) : null,
    ]);

  return (
    <ChatRoom
      roomId={params.roomId}
      initialType={type}
      initialMessages={messages}
      initialMembers={membersRes?.list || []}
      initialChatInfo={membersRes?.info || null}
      initialGroupChatDetails={groupChatDetails}
      currentUser={currentUser}
      sharedPost={readSharedPost(searchParams || {})}
    />
  );
}
