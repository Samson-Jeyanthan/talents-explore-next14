import {
  getCollaborationApplicantsAction,
  getCollaborationApplicantsStatsAction,
} from "@/actions/collaboration.action";
import CollaborationApplicants from "@/components/widgets/collaboration/CollaborationApplicants";
import { loadOwnedCollaboration } from "@/lib/collaboration-management";
export const dynamic = "force-dynamic";
export default async function Page({ params }: { params: { id: string } }) {
  const { details } = await loadOwnedCollaboration(params.id);
  const [stats, result] = await Promise.all([
    getCollaborationApplicantsStatsAction(params.id),
    getCollaborationApplicantsAction(params.id, { filter: "ALL" }),
  ]);
  return (
    <CollaborationApplicants
      key={params.id}
      collaborationId={params.id}
      collaborationDetails={details}
      initialStats={stats}
      initialResult={result}
    />
  );
}
