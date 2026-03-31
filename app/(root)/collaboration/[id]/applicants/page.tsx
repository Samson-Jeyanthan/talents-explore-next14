import {
  getCollaborationApplicantsAction,
  getCollaborationApplicantsStatsAction,
  getCollaborationDetailsAction,
  getCurrentCollaborationUserAction,
} from "@/actions/collaboration.action";
import CollaborationApplicants from "@/components/widgets/collaboration/CollaborationApplicants";

export const dynamic = "force-dynamic";

export default async function CollaborationApplicantsPage({
  params,
}: {
  params: { id: string };
}) {
  const [currentUser, collaborationDetails, stats, applicants] = await Promise.all([
    getCurrentCollaborationUserAction(),
    getCollaborationDetailsAction(params.id),
    getCollaborationApplicantsStatsAction(params.id),
    getCollaborationApplicantsAction(params.id, { filter: "ALL" }),
  ]);

  return (
    <CollaborationApplicants
      collaborationId={params.id}
      currentUser={currentUser}
      collaborationDetails={collaborationDetails}
      initialStats={stats}
      initialApplicants={applicants.response || []}
    />
  );
}
