import { getCollaborationDetailsAction } from "@/actions/collaboration.action";
import CollaborationInviteSuccess from "@/components/widgets/collaboration/CollaborationInviteSuccess";

export const dynamic = "force-dynamic";

export default async function CollaborationInviteSuccessPage({
  params,
}: {
  params: { id: string };
}) {
  const details = await getCollaborationDetailsAction(params.id);

  return <CollaborationInviteSuccess collaborationId={params.id} roles={details?.roles || []} />;
}

