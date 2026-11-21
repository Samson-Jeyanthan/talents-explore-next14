"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  invitePeopleToCollaborationAction,
  searchCollaborationPeopleAction,
} from "@/actions/collaboration.action";
import {
  useCollaborationWrite,
  useWorkflowPages,
} from "@/lib/hooks/useCollaborationWorkflow";
import { validRoleIds } from "@/lib/utils/collaboration-workflow";
import { collaborationSelection } from "@/lib/utils/collaboration-editor";
import UserProfileImg from "@/components/others/UserProfileImg";
import { Button } from "@/components/ui/button";
import CollaborationPeopleFilters from "./CollaborationPeopleFilters";

export default function CollaborationInvitePeople({
  collaborationId,
  currentUser,
  selectedRoleIds,
}: {
  collaborationId: string;
  currentUser: any;
  selectedRoleIds: string[];
}) {
  const [selected, setSelected] = useState<Record<string, any>>({});
  const [sent, setSent] = useState(false);
  const sentRef = useRef(false);
  const write = useCollaborationWrite(collaborationId);
  const pages = useWorkflowPages(
    collaborationId,
    [],
    searchCollaborationPeopleAction,
    collaborationSelection,
  );
  const firstLoad = useRef(pages.apply);
  useEffect(() => {
    firstLoad.current({ searchText: "" });
  }, []);
  const roles = validRoleIds(selectedRoleIds);
  const send = () => {
    if (sentRef.current || !roles.length || !Object.keys(selected).length)
      return;
    write.run(
      () =>
        invitePeopleToCollaborationAction(collaborationId, {
          invites: roles.flatMap((role) =>
            Object.keys(selected).map((person) => ({
              collaborationRoleId: role,
              applicantId: person,
            })),
          ),
        }),
      () => {
        sentRef.current = true;
        setSent(true);
        window.location.assign(
          `/collaboration/${collaborationId}/invite/success`,
        );
      },
    );
  };
  const toggle = (person: any) => {
    const id = collaborationSelection(person);
    setSelected((previous) => {
      const next = { ...previous };
      if (next[id]) delete next[id];
      else next[id] = person;
      return next;
    });
  };
  const disabled = write.pending || sent;
  return (
    <section className="flex w-full max-w-6xl flex-col gap-5 px-4 py-6 sm:px-6">
      <header className="rounded-3xl border border-dark-300 bg-dark-250 p-5">
        <h1 className="text-2xl font-semibold text-light-900">
          Invite people to collaborate
        </h1>
        <p className="mt-2 text-sm text-light-600">
          Choose people for {roles.length} selected role
          {roles.length === 1 ? "" : "s"}. Each person will receive an
          invitation for each role.
        </p>
        <Link
          href={`/collaboration/${collaborationId}/invite`}
          className="mt-3 inline-block text-sm text-primary-500 underline"
        >
          Change roles
        </Link>
      </header>
      <CollaborationPeopleFilters
        disabled={disabled}
        loading={pages.loading}
        onApply={pages.apply}
      />
      {Object.keys(selected).length ? (
        <div className="rounded-2xl border border-dark-300 p-4">
          <p className="text-sm text-light-700">
            Selected people ({Object.keys(selected).length})
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            {Object.entries(selected).map(([id, person]) => (
              <Button
                key={id}
                type="button"
                disabled={disabled}
                aria-label={`Remove ${person.userName || "person"} from invitations`}
                onClick={() => toggle(person)}
              >
                {person.userName || "Person"} ×
              </Button>
            ))}
          </div>
        </div>
      ) : null}
      {pages.error ? (
        <div role="alert" className="text-sm text-light-700">
          {pages.error}
          <Button
            type="button"
            disabled={pages.loading || disabled}
            onClick={pages.retry}
          >
            Retry loading
          </Button>
        </div>
      ) : null}
      <div aria-busy={pages.loading} className="grid gap-3">
        {pages.items
          .filter(
            (person) =>
              collaborationSelection(person) !==
              collaborationSelection(currentUser),
          )
          .map((person) => {
            const id = collaborationSelection(person);
            const professional = person.professional;
            return (
              <button
                key={id}
                type="button"
                disabled={disabled}
                aria-pressed={!!selected[id]}
                onClick={() => toggle(person)}
                className={`flex items-center gap-4 rounded-3xl border p-4 text-left ${selected[id] ? "border-primary-500 bg-primary-500/10" : "border-dark-300 bg-dark-250"}`}
              >
                <UserProfileImg
                  src={person.profileImage || null}
                  userName={person.userName || "User"}
                />
                <div className="min-w-0 flex-1">
                  <p className="break-words font-semibold text-light-900">
                    {person.userName || "User"}
                  </p>
                  <p className="text-sm text-light-600">
                    {typeof professional === "string"
                      ? professional
                      : professional?.professional || ""}
                  </p>
                </div>
                <span className="text-sm text-light-700">
                  {selected[id] ? "Selected" : "Select"}
                </span>
              </button>
            );
          })}
      </div>
      {pages.loading ? (
        <p role="status" className="text-light-600">
          Loading people...
        </p>
      ) : null}
      {!pages.items.length && !pages.loading && !pages.error ? (
        <p className="text-sm text-light-600">
          No people found. Try another search or clear the filters.
        </p>
      ) : null}
      {pages.hasMore && !pages.error ? (
        <Button
          type="button"
          disabled={pages.loading || disabled}
          onClick={pages.more}
        >
          Load more people
        </Button>
      ) : null}
      {write.error ? (
        <p role="alert" className="text-sm text-red-700 dark:text-red-300">
          {write.error}
        </p>
      ) : null}
      {sent ? (
        <p role="status" className="text-light-700">
          Invitations sent.{" "}
          <Link
            href={`/collaboration/${collaborationId}/invite/success`}
            className="underline"
          >
            Continue
          </Link>
        </p>
      ) : null}
      <Button
        type="button"
        className="shad-button_primary"
        disabled={disabled || !roles.length || !Object.keys(selected).length}
        onClick={send}
      >
        {write.pending ? "Sending invitations..." : "Send invitations"}
      </Button>
    </section>
  );
}
