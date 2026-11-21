import { loadOwnedCollaboration } from "@/lib/collaboration-management";
import { notFound } from "next/navigation";
import { getCollaborationApplicantDetailsAction } from "@/actions/collaboration.action";
import CollaborationApplicantDetails from "@/components/widgets/collaboration/CollaborationApplicantDetails";

export const dynamic = "force-dynamic";

export default async function CollaborationApplicantDetailsPage({
  params,
}: {
  params: { id: string; applicationId: string };
}) {
  await loadOwnedCollaboration(params.id);
  if (!/^[a-f\d]{24}$/i.test(params.applicationId)) notFound();
  const application = await getCollaborationApplicantDetailsAction(
    params.id,
    params.applicationId,
  );

  return (
    <CollaborationApplicantDetails
      key={params.id + params.applicationId}
      collaborationId={params.id}
      applicationId={params.applicationId}
      initialApplication={application}
    />
  );
}
