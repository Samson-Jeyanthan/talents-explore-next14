"use client";

import { Button } from "@/components/ui/button";
import { CheckCircle2, Users } from "lucide-react";
import Link from "next/link";

export default function CollaborationInviteSuccess({
  collaborationId,
  roles,
}: {
  collaborationId: string;
  roles: any[];
}) {
  return (
    <section className="flex w-full max-w-5xl flex-col gap-5 px-4 py-8 sm:px-6">
      <div className="rounded-[36px] border border-dark-300 bg-dark-250 p-8 text-center">
        <div className="mx-auto flex size-20 items-center justify-center rounded-full bg-primary-500/15 text-primary-500">
          <CheckCircle2 className="size-10" />
        </div>
        <h1 className="pt-6 text-3xl font-semibold text-light-900">Invitations sent</h1>
        <p className="mx-auto max-w-2xl pt-3 text-sm text-light-500">
          Your collaboration invitations were sent successfully. You can invite more people for the
          same roles or return to the collaboration details page.
        </p>

        <div className="mt-6 rounded-[28px] border border-dark-300 bg-dark-200 p-4">
          <p className="text-xs uppercase tracking-[0.16em] text-light-500">Available roles</p>
          <div className="mt-3 flex flex-wrap justify-center gap-2">
            {(roles || []).map((role: any) => (
              <span
                key={role?._id || role?.roleId || role?.name}
                className="rounded-full border border-dark-300 bg-dark-250 px-3 py-2 text-xs text-light-900"
              >
                {role?.name || "Role"}
              </span>
            ))}
          </div>
        </div>

        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <Link href={`/collaboration/${collaborationId}/invite`}>
            <Button type="button" className="rounded-full bg-primary-500 text-light-900">
              <Users className="mr-2 size-4" />
              Invite More People
            </Button>
          </Link>
          <Link href={`/collaboration/${collaborationId}`}>
            <Button type="button" className="rounded-full bg-dark-200 text-light-900 hover:bg-dark-300">
              Complete Collaboration
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}
