import ChatAccessNotice from "@/components/widgets/chat/ChatAccessNotice";
import { groupMemberAllowed } from "@/lib/utils/collaboration-schedule";
import {
  getChatMembersAction,
  getChatMessagesAction,
  getCurrentChatUserAction,
  getGroupChatRoomDetailsAction,
} from "@/actions/chat.action";
import ChatRoom from "@/components/widgets/chat/ChatRoom";
import { readSharedPost } from "@/lib/utils/postSharing";
import TalentAccessNotice from "@/components/others/TalentAccessNotice";

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

  if (type === "group") {
    const currentUser = await getCurrentChatUserAction();
    if (currentUser?.isTalent !== true) return <TalentAccessNotice />;
    const members = await getChatMembersAction(params.roomId);
    if (members.status !== "7400") return <ChatAccessNotice />;
    if (!groupMemberAllowed(currentUser, members.list))
      return <ChatAccessNotice denied />;
    const [messages, group] = await Promise.all([
      getChatMessagesAction({
        roomId: params.roomId,
        direction: "down",
        pageSize: 10,
      }),
      getGroupChatRoomDetailsAction(params.roomId),
    ]);
    return (
      <ChatRoom
        key={params.roomId}
        roomId={params.roomId}
        initialType="group"
        initialMessages={messages}
        initialMembers={members.list}
        initialChatInfo={members.info}
        initialGroupChatDetails={group}
        currentUser={currentUser}
        sharedPost={readSharedPost(searchParams || {})}
      />
    );
  }

  const [currentUser, messages, membersRes] = await Promise.all([
    getCurrentChatUserAction(),
    getChatMessagesAction({
      roomId: params.roomId,
      direction: "down",
      pageSize: 10,
    }),
    getChatMembersAction(params.roomId),
  ]);
  if (membersRes.status === "403" && currentUser?.isTalent !== true)
    return <TalentAccessNotice />;
  if (membersRes.status !== "7400")
    return <ChatAccessNotice denied={membersRes.status === "403"} />;

  return (
    <ChatRoom
      roomId={params.roomId}
      initialType={type}
      initialMessages={messages}
      initialMembers={membersRes?.list || []}
      initialChatInfo={membersRes?.info || null}
      initialGroupChatDetails={null}
      currentUser={currentUser}
      sharedPost={readSharedPost(searchParams || {})}
    />
  );
}
