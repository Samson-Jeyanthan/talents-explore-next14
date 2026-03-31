import { getCollaborationDetailsAction } from "@/actions/collaboration.action";
import CollaborationInviteRoles from "@/components/widgets/collaboration/CollaborationInviteRoles";

export const dynamic = "force-dynamic";

export default async function CollaborationInvitePage({
  params,
}: {
  params: { id: string };
}) {
  const details = await getCollaborationDetailsAction(params.id);

  return (
    <CollaborationInviteRoles
      collaborationId={params.id}
      roles={details?.roles || []}
    />
  );
}

