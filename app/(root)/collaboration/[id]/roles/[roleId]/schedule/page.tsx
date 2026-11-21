import {
  getCollaborationDetailsAction,
  getCurrentCollaborationUserAction,
} from "@/actions/collaboration.action";
import CollaborationSchedulePage from "@/components/widgets/collaboration/CollaborationSchedulePage";
import { collaborationSelection } from "@/lib/utils/collaboration-editor";
import { canUseCollaborationChat } from "@/lib/utils/collaboration-schedule";
import { notFound } from "next/navigation";
export const dynamic = "force-dynamic";
export default async function Page({
  params,
}: {
  params: { id: string; roleId: string };
}) {
  if (![params.id, params.roleId].every((id) => /^[a-f\d]{24}$/i.test(id)))
    notFound();
  const [details, currentUser] = await Promise.all([
    getCollaborationDetailsAction(params.id),
    getCurrentCollaborationUserAction(),
  ]);
  if (!details?.collaboration || !Array.isArray(details.roles))
    throw new Error("Unable to load the role schedule. Please retry.");
  const role = details.roles.find(
    (item: any) => collaborationSelection(item) === params.roleId,
  );
  if (!role) notFound();
  if (role.timeLine != null && !Array.isArray(role.timeLine))
    throw new Error("Unable to read the role schedule. Please retry.");
  return (
    <CollaborationSchedulePage
      key={params.id + params.roleId}
      collaborationId={params.id}
      role={role}
      chatRoomId={
        canUseCollaborationChat(currentUser, details)
          ? collaborationSelection(details.collaboration.roomId)
          : undefined
      }
    />
  );
}
