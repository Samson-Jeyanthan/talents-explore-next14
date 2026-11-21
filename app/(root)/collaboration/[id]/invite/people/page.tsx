import CollaborationInvitePeople from "@/components/widgets/collaboration/CollaborationInvitePeople";
import { loadOwnedCollaboration } from "@/lib/collaboration-management";
import { collaborationSelection } from "@/lib/utils/collaboration-editor";
import { validRoleIds } from "@/lib/utils/collaboration-workflow";
import { redirect } from "next/navigation";
export const dynamic = "force-dynamic";
export default async function Page({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: { roles?: string };
}) {
  const { details, currentUser } = await loadOwnedCollaboration(params.id);
  const requested =
    typeof searchParams.roles === "string" ? searchParams.roles.split(",") : [];
  const roles = validRoleIds(requested);
  if (
    !roles.length ||
    roles.length !== new Set(requested).size ||
    roles.some(
      (id) =>
        !details.roles?.some(
          (role: any) => collaborationSelection(role) === id,
        ),
    )
  )
    redirect(`/collaboration/${params.id}/invite`);
  return (
    <CollaborationInvitePeople
      key={params.id + roles.join(",")}
      collaborationId={params.id}
      currentUser={currentUser}
      selectedRoleIds={roles}
    />
  );
}
