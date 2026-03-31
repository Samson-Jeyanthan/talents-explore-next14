import {
  getCollaborationApplicantDetailsAction,
} from "@/actions/collaboration.action";
import CollaborationApplicantDetails from "@/components/widgets/collaboration/CollaborationApplicantDetails";

export const dynamic = "force-dynamic";

export default async function CollaborationApplicantDetailsPage({
  params,
}: {
  params: { id: string; applicationId: string };
}) {
  const application = await getCollaborationApplicantDetailsAction(
    params.id,
    params.applicationId
  );

  return (
    <CollaborationApplicantDetails
      collaborationId={params.id}
      applicationId={params.applicationId}
      initialApplication={application}
    />
  );
}
