import { getCollaborationDetailsAction } from "@/actions/collaboration.action";
import CollaborationCreateSuccess from "@/components/widgets/collaboration/CollaborationCreateSuccess";

export const dynamic = "force-dynamic";

export default async function CollaborationCreateSuccessPage({
  params,
}: {
  params: { id: string };
}) {
  const details = await getCollaborationDetailsAction(params.id);

  return <CollaborationCreateSuccess collaborationId={params.id} roles={details?.roles || []} />;
}

