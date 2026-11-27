"use client";
import LinkedText from "@/components/others/LinkedText";
import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  getCollaborationApplicantsAction,
  getCollaborationApplicantsStatsAction,
  getCollaborationApplicantsRoleStatsAction,
  reviewCollaborationApplicantAction,
} from "@/actions/collaboration.action";
import {
  useCollaborationWrite,
  useWorkflowPages,
} from "@/lib/hooks/useCollaborationWorkflow";
import {
  applicationKey,
  applicantIdentity,
  applicantStatusLabel,
  reviewStatuses,
} from "@/lib/utils/collaboration-workflow";
import { collaborationSelection } from "@/lib/utils/collaboration-editor";
import UserProfileImg from "@/components/others/UserProfileImg";
import CollaborationReviewButtons from "./CollaborationReviewButtons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const filters = [
  { key: "ALL", label: "Applicants", count: "totalApplicants" },
  { key: "INVITED", label: "Invitees", count: "totalInvites" },
  { key: "SHORTLISTED", label: "Shortlisted", count: "totalShortlisted" },
  { key: "FINALIZED", label: "Finalized", count: "totalFinalized" },
  { key: "REJECTED", label: "Rejected", count: "totalRejected" },
  { key: "ROLE", label: "Roles", count: "totalRoles" },
];
function profession(person: any) {
  const value = person?.professional;
  return typeof value === "string"
    ? value
    : value?.professional || value?.name || "";
}
export default function CollaborationApplicantList({
  collaborationId,
  roleId,
  role,
  collaborationDetails,
  initialStats,
  initialResult,
}: {
  collaborationId: string;
  roleId?: string;
  role?: any;
  collaborationDetails?: any;
  initialStats: any;
  initialResult: any;
}) {
  const [filter, setFilter] = useState("ALL");
  const [search, setSearch] = useState("");
  const [stats, setStats] = useState(initialStats);
  const [statsError, setStatsError] = useState(
    initialStats ? "" : "Applicant counts could not be loaded.",
  );
  const write = useCollaborationWrite(`${collaborationId}:${roleId || "all"}`);
  const pages = useWorkflowPages(
    `${collaborationId}:${roleId || "all"}`,
    initialResult?.status === "7400" ? initialResult.response : [],
    (query) =>
      getCollaborationApplicantsAction(collaborationId, {
        ...query,
        roleId: roleId || null,
      }),
    applicationKey,
    initialResult?.status === "7400"
      ? ""
      : initialResult?.message ||
          "Unable to load applicants. Please try again.",
  );
  const reloadStats = async () => {
    try {
      const next = roleId
        ? await getCollaborationApplicantsRoleStatsAction(
            collaborationId,
            roleId,
          )
        : await getCollaborationApplicantsStatsAction(collaborationId);
      if (!next) throw new Error();
      setStats(next);
      setStatsError("");
    } catch {
      setStatsError(
        "Applicant counts could not be refreshed. Previously loaded counts are shown.",
      );
    }
  };
  const review = (item: any, action: string) =>
    write.run(
      () =>
        reviewCollaborationApplicantAction(collaborationId, {
          collaborationRoleId:
            collaborationSelection(item.roleId) || roleId || "",
          applicantId: applicantIdentity(item),
          action,
        }),
      async () => {
        pages.setItems((previous) =>
          previous.map((row) =>
            applicationKey(row) === applicationKey(item)
              ? { ...row, applicantStatus: reviewStatuses[action] }
              : row,
          ),
        );
        await Promise.all([reloadStats(), pages.refresh()]);
      },
    );
  const roles = Array.isArray(collaborationDetails?.roles)
    ? collaborationDetails.roles
    : [];
  return (
    <section className="flex w-full max-w-7xl flex-col gap-5 px-4 py-6 sm:px-6">
      <header className="rounded-3xl border border-dark-300 bg-dark-250 p-5">
        <h1 className="text-2xl font-semibold text-light-900">
          {roleId ? `${role?.name || "Role"} applicants` : "Applicants"}
        </h1>
        <p className="mt-2 text-sm text-light-600">
          Review applications, invitations, and selection progress.
        </p>
        <div className="mt-3 flex flex-wrap gap-3">
          <Link
            href={`/collaboration/${collaborationId}`}
            className="text-sm text-primary-500 underline"
          >
            Back to collaboration
          </Link>
          {roleId ? (
            <Link
              href={`/collaboration/${collaborationId}/roles/${roleId}/schedule`}
              className="text-sm text-primary-500 underline"
            >
              View schedule
            </Link>
          ) : null}
        </div>
      </header>
      <div className="rounded-3xl border border-dark-300 bg-dark-250 p-4">
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
          {filters
            .filter((item) => !roleId || item.key !== "ROLE")
            .map((item) => (
              <button
                key={item.key}
                type="button"
                disabled={write.pending}
                aria-pressed={filter === item.key}
                onClick={() => {
                  setFilter(item.key);
                  setSearch("");
                  if (item.key !== "ROLE")
                    pages.apply({ filter: item.key, search: "" });
                }}
                className={`rounded-2xl border p-4 text-left text-sm text-light-900 ${filter === item.key ? "border-primary-500 bg-primary-500/10" : "border-dark-300 bg-dark-200"}`}
              >
                <span className="block font-semibold">
                  {stats?.[item.count] ?? "—"}
                </span>
                {item.label}
              </button>
            ))}
        </div>
        {statsError ? (
          <div role="status" className="mt-3 text-sm text-light-600">
            {statsError}
            <Button
              type="button"
              disabled={write.pending}
              onClick={reloadStats}
            >
              Retry counts
            </Button>
          </div>
        ) : null}
        {filter !== "ROLE" ? (
          <form
            onSubmit={(event) => {
              event.preventDefault();
              if (!write.pending)
                pages.apply({ filter, search: search.trim() });
            }}
            className="mt-4 flex flex-wrap gap-2"
          >
            <label className="min-w-0 flex-1 text-sm text-light-700">
              Search applicants
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Name or username"
                disabled={write.pending}
              />
            </label>
            <Button type="submit" disabled={write.pending || pages.loading}>
              Search
            </Button>
          </form>
        ) : null}
      </div>
      {write.error ? (
        <p role="alert" className="text-sm text-red-700 dark:text-red-300">
          {write.error}
        </p>
      ) : null}
      {filter === "ROLE" ? (
        <div className="grid gap-3">
          {roles.map((item: any) => (
            <article
              key={collaborationSelection(item)}
              className="relative rounded-3xl border border-dark-300 bg-dark-250 p-5"
            >
              <h2 className="text-lg font-semibold text-light-900">
                <Link
                  href={`/collaboration/${collaborationId}/roles/${collaborationSelection(item)}/applicants`}
                  className="after:absolute after:inset-0 after:rounded-3xl focus-visible:outline focus-visible:outline-2"
                >
                  {item.name}
                </Link>
              </h2>
              <p className="mt-2 text-sm text-light-600 [&_a]:relative [&_a]:z-10">
                <LinkedText text={item.subtitle || item.description} />
              </p>
            </article>
          ))}
          {!roles.length ? (
            <p className="text-light-600">No roles found.</p>
          ) : null}
        </div>
      ) : (
        <>
          {pages.error ? (
            <div
              role="alert"
              className="rounded-2xl border border-dark-300 p-4 text-sm text-light-700"
            >
              {pages.error}
              <Button
                type="button"
                disabled={pages.loading || write.pending}
                onClick={pages.retry}
              >
                Retry loading
              </Button>
            </div>
          ) : null}
          <div aria-busy={pages.loading} className="grid gap-4">
            {pages.items.map((item) => {
              const person = item.applicant || {};
              const personId = applicantIdentity(item);
              const key = applicationKey(item);
              return (
                <article
                  key={key}
                  className="rounded-3xl border border-dark-300 bg-dark-250 p-4"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-3">
                      <UserProfileImg
                        src={person.profileImage || null}
                        userName={person.userName || "Applicant"}
                        className="size-12 min-w-12"
                      />
                      <div className="min-w-0">
                        <h2 className="break-words font-semibold text-light-900">
                          {person.userName || item.applicantName || "Applicant"}
                        </h2>
                        <p className="text-sm text-light-600">
                          {profession(person)}
                        </p>
                        <p className="mt-1 text-sm text-light-700">
                          {item.roleName || role?.name || "Role"}
                        </p>
                      </div>
                    </div>
                    <span
                      role="status"
                      className="rounded-full border border-dark-300 px-3 py-1 text-xs text-light-700"
                    >
                      {applicantStatusLabel(item)}
                    </span>
                  </div>
                  {Number(person.avgRating) > 0 ? (
                    <p className="mt-3 text-sm text-light-700">
                      Rating: {Number(person.avgRating).toFixed(1)} (
                      {Number(person.numberOfRating) || 0})
                    </p>
                  ) : null}
                  {item.createdAt &&
                  !Number.isNaN(Date.parse(item.createdAt)) ? (
                    <p className="mt-2 text-xs text-light-600">
                      {new Date(item.createdAt).toLocaleDateString()}
                    </p>
                  ) : null}
                  {Array.isArray(item.bestWork) ? (
                    <div className="mt-3 flex gap-2 overflow-x-auto">
                      {item.bestWork.map((work: any, index: number) => {
                        const postId = collaborationSelection(
                          work._id ?? work.postId,
                        );
                        const media = work.media?.[0];
                        const thumbnail =
                          media?.mediaType === "video"
                            ? media?.thumbnailUrl
                            : media?.url;
                        return postId ? (
                          <Link
                            key={`${postId}-${index}`}
                            href={`/post/${postId}`}
                            className="flex size-20 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-dark-300 text-xs text-light-600"
                          >
                            {typeof thumbnail === "string" && thumbnail ? (
                              <Image
                                src={thumbnail}
                                alt={work.about?.title || "Best work"}
                                width={80}
                                height={80}
                                className="size-full object-cover"
                              />
                            ) : (
                              "View work"
                            )}
                          </Link>
                        ) : null;
                      })}
                    </div>
                  ) : null}
                  <div className="mt-4 flex flex-wrap gap-3 text-sm text-primary-500">
                    <Link
                      href={`/collaboration/${collaborationId}/applicants/${key}`}
                    >
                      Review details
                    </Link>
                    {person.userName && personId ? (
                      <Link
                        href={`/profile/${encodeURIComponent(person.userName)}/${personId}`}
                      >
                        View profile
                      </Link>
                    ) : null}
                    {["ACCEPTED", "SHORTLISTED", "FINALIZED"].includes(
                      item.applicantStatus,
                    ) && personId ? (
                      <Link href={`/chat/start/${personId}`}>Chat</Link>
                    ) : null}
                  </div>
                  <div className="mt-4">
                    <CollaborationReviewButtons
                      application={item}
                      pending={write.pending || pages.loading}
                      onReview={(action) => review(item, action)}
                    />
                  </div>
                </article>
              );
            })}
          </div>
          {pages.loading ? (
            <p role="status" className="text-sm text-light-600">
              Loading applicants...
            </p>
          ) : null}
          {!pages.items.length && !pages.loading && !pages.error ? (
            <p className="rounded-2xl border border-dashed border-dark-300 p-8 text-center text-sm text-light-600">
              No applicants found.
            </p>
          ) : null}
          {pages.hasMore && !pages.error ? (
            <Button
              type="button"
              disabled={pages.loading || write.pending}
              onClick={pages.more}
              className="mx-auto"
            >
              Load more
            </Button>
          ) : null}
        </>
      )}
    </section>
  );
}
