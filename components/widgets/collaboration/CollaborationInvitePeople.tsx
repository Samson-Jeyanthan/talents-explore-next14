"use client";

import {
  invitePeopleToCollaborationAction,
  searchCollaborationPeopleAction,
} from "@/actions/collaboration.action";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import UserProfileImg from "@/components/others/UserProfileImg";
import { Search } from "lucide-react";
import { useMemo, useState, useTransition } from "react";
import { toast } from "sonner";

export default function CollaborationInvitePeople({
  collaborationId,
  selectedRoleIds,
}: {
  collaborationId: string;
  currentUser: any;
  selectedRoleIds: string[];
  lookupData: any;
}) {
  const [searchText, setSearchText] = useState("");
  const [people, setPeople] = useState<any[]>([]);
  const [selectedPeople, setSelectedPeople] = useState<string[]>([]);
  const [pending, startTransition] = useTransition();

  const peopleIds = useMemo(() => new Set(selectedPeople), [selectedPeople]);

  const searchPeople = () =>
    startTransition(async () => {
      const res = await searchCollaborationPeopleAction({ searchText, pageNo: 1, pageSize: 20 });
      setPeople(res?.response || []);
    });

  const sendInvites = () =>
    startTransition(async () => {
      const invites: any[] = [];
      selectedRoleIds.forEach((roleId) => {
        selectedPeople.forEach((applicantId) => {
          invites.push({ collaborationRoleId: roleId, applicantId });
        });
      });

      const res = await invitePeopleToCollaborationAction(collaborationId, { invites });
      if (res?.status === "7400") {
        toast.success(res?.message || "Invitations sent");
        window.location.assign(`/collaboration/${collaborationId}/invite/success`);
        return;
      }

      toast.error(res?.message || "Failed to send invitations");
    });

  return (
    <section className="flex w-full max-w-6xl flex-col gap-5 px-4 py-6 sm:px-6">
      <div className="rounded-[32px] border border-dark-300 bg-dark-250 p-6">
        <h1 className="text-3xl font-semibold text-light-900">
          Invite Friends or People to Collaborate
        </h1>
        <p className="pt-2 text-sm text-light-500">
          Search for people and invite them to join this collaboration.
        </p>
      </div>

      <div className="rounded-[28px] border border-dark-300 bg-dark-250 p-5">
        <div className="relative">
          <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-light-500" />
          <Input
            value={searchText}
            onChange={(event) => setSearchText(event.target.value)}
            placeholder="Search people to invite"
            className="h-12 rounded-full border-dark-300 bg-dark-200 pl-11 text-light-900 placeholder:text-light-500"
          />
        </div>
        <div className="pt-3">
          <Button
            type="button"
            disabled={pending}
            className="rounded-full bg-primary-500 text-light-900"
            onClick={searchPeople}
          >
            Search
          </Button>
        </div>
      </div>

      <div className="grid gap-3">
        {people.map((person) => {
          const isSelected = peopleIds.has(person?._id);

          return (
            <button
              key={person?._id}
              type="button"
              onClick={() =>
                setSelectedPeople((prev) =>
                  prev.includes(person._id)
                    ? prev.filter((item) => item !== person._id)
                    : [...prev, person._id]
                )
              }
              className={`flex items-center gap-4 rounded-[28px] border p-4 text-left transition ${
                isSelected
                  ? "border-primary-500 bg-primary-500/10"
                  : "border-dark-300 bg-dark-250 hover:border-primary-500/40"
              }`}
            >
              <UserProfileImg src={person?.profileImage || null} userName={person?.userName || "User"} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-base font-semibold text-light-900">{person?.userName}</p>
                <p className="truncate pt-1 text-sm text-light-500">{person?.professional || ""}</p>
              </div>
              <div
                className={`size-5 rounded-md border ${
                  isSelected ? "border-primary-500 bg-primary-500" : "border-dark-300"
                }`}
              />
            </button>
          );
        })}

        {people.length === 0 ? (
          <div className="rounded-[28px] border border-dashed border-dark-300 bg-dark-250 px-4 py-12 text-center text-sm text-light-500">
            {pending ? "Loading people..." : "No people found."}
          </div>
        ) : null}
      </div>

      <div className="flex justify-end">
        <Button
          type="button"
          disabled={pending || selectedRoleIds.length === 0 || selectedPeople.length === 0}
          className="rounded-full bg-primary-500 text-light-900"
          onClick={sendInvites}
        >
          {pending ? "Sending..." : "Send Invitation"}
        </Button>
      </div>
    </section>
  );
}
