import {
  getCollaborationApplicantsAction,
  getCollaborationApplicantsRoleStatsAction,
} from "@/actions/collaboration.action";
import CollaborationApplicantsByRole from "@/components/widgets/collaboration/CollaborationApplicantsByRole";
import { loadOwnedCollaboration } from "@/lib/collaboration-management";
import { collaborationSelection } from "@/lib/utils/collaboration-editor";
import { notFound } from "next/navigation";
export const dynamic = "force-dynamic";
export default async function Page({
  params,
}: {
  params: { id: string; roleId: string };
}) {
  const { details } = await loadOwnedCollaboration(params.id);
  const role = details.roles?.find(
    (role: any) => collaborationSelection(role) === params.roleId,
  );
  if (!role) notFound();
  const [stats, result] = await Promise.all([
    getCollaborationApplicantsRoleStatsAction(params.id, params.roleId),
    getCollaborationApplicantsAction(params.id, {
      roleId: params.roleId,
      filter: "ALL",
    }),
  ]);
  return (
    <CollaborationApplicantsByRole
      key={params.id + params.roleId}
      collaborationId={params.id}
      roleId={params.roleId}
      role={role}
      initialStats={stats}
      initialResult={result}
    />
  );
}
