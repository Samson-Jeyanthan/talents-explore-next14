"use client";

import { Button } from "@/components/ui/button";
import { CheckCircle2, Plus, Users } from "lucide-react";
import Link from "next/link";

export default function CollaborationCreateSuccess({
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
        <h1 className="pt-6 text-3xl font-semibold text-light-900">Collaboration created</h1>
        <p className="mx-auto max-w-2xl pt-3 text-sm text-light-500">
          Your collaboration is live now. You can review the details, invite people directly,
          or jump into the applicants dashboard when responses start coming in.
        </p>

        <div className="mt-6 grid gap-3 rounded-[28px] border border-dark-300 bg-dark-200 p-4 md:grid-cols-3">
          <div>
            <p className="text-xs uppercase tracking-[0.16em] text-light-500">Roles</p>
            <p className="pt-2 text-2xl font-semibold text-light-900">{roles?.length || 0}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.16em] text-light-500">Next Step</p>
            <p className="pt-2 text-sm text-light-900">Invite people or share the collaboration</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.16em] text-light-500">Status</p>
            <p className="pt-2 text-sm text-primary-500">Ready for applicants</p>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <Link href={`/collaboration/${collaborationId}`}>
            <Button type="button" className="rounded-full bg-primary-500 text-light-900">
              View Collaboration
            </Button>
          </Link>
          <Link href={`/collaboration/${collaborationId}/invite`}>
            <Button type="button" className="rounded-full bg-dark-200 text-light-900 hover:bg-dark-300">
              <Users className="mr-2 size-4" />
              Invite People
            </Button>
          </Link>
          <Link href="/collaboration/create">
            <Button type="button" className="rounded-full bg-dark-200 text-light-900 hover:bg-dark-300">
              <Plus className="mr-2 size-4" />
              Create Another
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}
