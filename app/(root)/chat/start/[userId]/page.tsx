import {
  createOneToOneChatAction,
  getCurrentChatUserAction,
} from "@/actions/chat.action";
import { redirect } from "next/navigation";

type Props = {
  params: {
    userId: string;
  };
};

export default async function ChatStartPage({ params }: Props) {
  const currentUser = await getCurrentChatUserAction();

  if (!params.userId || params.userId === currentUser?._id) {
    redirect("/chat");
  }

  const chatRoom = await createOneToOneChatAction(params.userId);

  if (chatRoom?.roomId) {
    redirect(`/chat/${chatRoom.roomId}?type=chat`);
  }

  redirect("/chat");
}
