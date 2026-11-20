import {
  getCollaborationListAction,
  getCurrentCollaborationUserAction,
} from "@/actions/collaboration.action";
import CollaborationDashboard from "@/components/widgets/collaboration/CollaborationDashboard";

export const dynamic = "force-dynamic";
export default async function CollaborationPage() {
  const [currentUser, initialResult] = await Promise.all([
    getCurrentCollaborationUserAction(),
    getCollaborationListAction({ type: "ALL" }),
  ]);
  return (
    <CollaborationDashboard
      key={currentUser._id}
      currentUser={currentUser}
      initialResult={initialResult}
    />
  );
}
