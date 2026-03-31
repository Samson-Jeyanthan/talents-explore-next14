import { getCollaborationDetailsAction } from "@/actions/collaboration.action";
import CollaborationSchedulePage from "@/components/widgets/collaboration/CollaborationSchedulePage";

export const dynamic = "force-dynamic";

export default async function CollaborationRoleSchedulePage({
  params,
}: {
  params: { id: string; roleId: string };
}) {
  const details = await getCollaborationDetailsAction(params.id);
  const role = Array.isArray(details?.roles)
    ? details.roles.find((item: any) => item?._id === params.roleId)
    : null;

  return <CollaborationSchedulePage collaborationId={params.id} role={role} />;
}
