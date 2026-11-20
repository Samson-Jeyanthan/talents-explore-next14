import {
  getCollaborationDetailsAction,
  getCurrentCollaborationUserAction,
} from "@/actions/collaboration.action";
import CollaborationEditor from "@/components/widgets/collaboration/CollaborationEditor";
import { collaborationSelection } from "@/lib/utils/collaboration-editor";
import { notFound, redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function EditCollaborationPage({
  params,
}: {
  params: { id: string };
}) {
  if (!/^[a-f\d]{24}$/i.test(params.id)) notFound();
  const [currentUser, collaborationDetails] = await Promise.all([
    getCurrentCollaborationUserAction(),
    getCollaborationDetailsAction(params.id),
  ]);

  // Never display a blank edit form after an unavailable details request.
  if (!collaborationDetails?.collaboration)
    throw new Error("Unable to load collaboration for editing.");
  if (
    collaborationSelection(collaborationDetails.owner) !==
    collaborationSelection(currentUser)
  )
    redirect(`/collaboration/${params.id}`);

  return (
    <CollaborationEditor
      key={params.id}
      mode="edit"
      collaborationId={params.id}
      currentUser={currentUser}
      initialDetails={collaborationDetails}
    />
  );
}
