"use client";

import { Button } from "@/components/ui/button";
import { Users } from "lucide-react";
import { useMemo, useState } from "react";

export default function CollaborationInviteRoles({
  collaborationId,
  roles,
}: {
  collaborationId: string;
  roles: any[];
}) {
  const [selected, setSelected] = useState<string[]>([]);
  const normalizedRoles = useMemo(
    () => (roles || []).map((role) => ({ ...role, id: role?.id || role?._id })),
    [roles]
  );

  return (
    <section className="flex w-full max-w-5xl flex-col gap-5 px-4 py-6 sm:px-6">
      <div className="rounded-[32px] border border-dark-300 bg-dark-250 p-6">
        <h1 className="text-3xl font-semibold text-light-900">
          Invite Friends or People to Collaborate
        </h1>
        <p className="pt-2 text-sm text-light-500">
          Select the roles you want to invite people for, then move to people selection.
        </p>
      </div>

      <div className="rounded-[28px] border border-dark-300 bg-dark-250 p-5 text-sm text-light-500">
        You can select one or more roles to send collaboration invitations.
      </div>

      <div className="grid gap-3">
        {normalizedRoles.map((role) => {
          const isActive = selected.includes(role.id);
          return (
            <button
              key={role.id}
              type="button"
              onClick={() =>
                setSelected((prev) =>
                  prev.includes(role.id) ? prev.filter((item) => item !== role.id) : [...prev, role.id]
                )
              }
              className={`flex items-center gap-4 rounded-[28px] border p-4 text-left transition ${
                isActive
                  ? "border-primary-500 bg-primary-500/10"
                  : "border-dark-300 bg-dark-250 hover:border-primary-500/40"
              }`}
            >
              <div className="flex size-11 items-center justify-center rounded-2xl bg-dark-200 text-light-900">
                <Users className="size-5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-base font-semibold text-light-900">{role?.name || "Role"}</p>
                <p className="pt-1 text-sm text-light-500">{role?.subtitle || ""}</p>
              </div>
              <div
                className={`size-5 rounded-md border ${
                  isActive ? "border-primary-500 bg-primary-500" : "border-dark-300"
                }`}
              />
            </button>
          );
        })}
      </div>

      <div className="flex justify-end">
        <Button
          type="button"
          disabled={selected.length === 0}
          className="rounded-full bg-primary-500 text-light-900"
          onClick={() => {
            if (selected.length === 0) return;
            window.location.assign(`/collaboration/${collaborationId}/invite/people?roles=${selected.join(",")}`);
          }}
        >
          Next
        </Button>
      </div>
    </section>
  );
}
