import CollaborationInviteRoles from "@/components/widgets/collaboration/CollaborationInviteRoles";
import { loadOwnedCollaboration } from "@/lib/collaboration-management";
export const dynamic = "force-dynamic";
export default async function Page({ params }: { params: { id: string } }) {
  const { details } = await loadOwnedCollaboration(params.id);
  return (
    <CollaborationInviteRoles
      key={params.id}
      collaborationId={params.id}
      roles={details.roles || []}
    />
  );
}
