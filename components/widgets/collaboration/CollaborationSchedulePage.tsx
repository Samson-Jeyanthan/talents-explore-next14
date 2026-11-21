import Link from "next/link";
import CollaborationTimeline from "./CollaborationTimeline";
import CollaborationRoleRequirements from "./CollaborationRoleRequirements";
import { detailText } from "@/lib/utils/collaboration-schedule";
export default function CollaborationSchedulePage({
  collaborationId,
  role,
  chatRoomId,
}: {
  collaborationId: string;
  role: any;
  chatRoomId?: string;
}) {
  return (
    <section className="flex w-full max-w-5xl flex-col gap-5 px-4 py-6 sm:px-6">
      <header className="rounded-3xl border border-dark-300 bg-dark-250 p-5">
        <p className="text-sm text-light-600">Role schedule</p>
        <h1 className="mt-2 break-words text-2xl font-semibold text-light-900">
          {detailText(role?.name, "Role")}
        </h1>
        <p className="mt-2 text-sm text-light-600">
          {detailText(role?.subtitle, "")}
        </p>
        <div className="mt-4 flex flex-wrap gap-3 text-sm text-primary-500">
          <Link href={`/collaboration/${collaborationId}`}>
            Back to collaboration
          </Link>
          {chatRoomId ? (
            <Link href={`/chat/${chatRoomId}?type=group`}>Open group chat</Link>
          ) : null}
        </div>
      </header>
      <CollaborationTimeline role={role} />
      <details className="rounded-3xl border border-dark-300 bg-dark-250 p-5">
        <summary className="cursor-pointer font-medium text-light-900">
          Role requirements and payment
        </summary>
        <div className="mt-4">
          <CollaborationRoleRequirements role={role} />
        </div>
      </details>
    </section>
  );
}
