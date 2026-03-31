import {
  getCollaborationDetailsAction,
  getCurrentCollaborationUserAction,
} from "@/actions/collaboration.action";
import CollaborationDetails from "@/components/widgets/collaboration/CollaborationDetails";

export const dynamic = "force-dynamic";

export default async function CollaborationDetailsPage({
  params,
}: {
  params: { id: string };
}) {
  const [currentUser, collaborationDetails] = await Promise.all([
    getCurrentCollaborationUserAction(),
    getCollaborationDetailsAction(params.id),
  ]);

  return (
    <CollaborationDetails
      collaborationId={params.id}
      currentUser={currentUser}
      initialDetails={collaborationDetails}
    />
  );
}

