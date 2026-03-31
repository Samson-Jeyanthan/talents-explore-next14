import {
  getCollaborationApplicantsAction,
  getCollaborationApplicantsRoleStatsAction,
  getCollaborationDetailsAction,
} from "@/actions/collaboration.action";
import CollaborationApplicantsByRole from "@/components/widgets/collaboration/CollaborationApplicantsByRole";

export const dynamic = "force-dynamic";

export default async function CollaborationApplicantsByRolePage({
  params,
}: {
  params: { id: string; roleId: string };
}) {
  const [details, stats, applicants] = await Promise.all([
    getCollaborationDetailsAction(params.id),
    getCollaborationApplicantsRoleStatsAction(params.id, params.roleId),
    getCollaborationApplicantsAction(params.id, {
      roleId: params.roleId,
      filter: "ALL",
      pageNo: 1,
      pageSize: 20,
    }),
  ]);

  return (
    <CollaborationApplicantsByRole
      collaborationId={params.id}
      roleId={params.roleId}
      role={Array.isArray(details?.roles) ? details.roles.find((item: any) => item?._id === params.roleId) : null}
      initialStats={stats}
      initialApplicants={applicants?.response || []}
    />
  );
}

