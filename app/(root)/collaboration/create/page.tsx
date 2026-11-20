import { getCurrentCollaborationUserAction } from "@/actions/collaboration.action";
import CollaborationEditor from "@/components/widgets/collaboration/CollaborationEditor";

export const dynamic = "force-dynamic";

export default async function CreateCollaborationPage() {
  const currentUser = await getCurrentCollaborationUserAction();

  return <CollaborationEditor mode="create" currentUser={currentUser} />;
}
