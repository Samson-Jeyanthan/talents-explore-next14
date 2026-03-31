"use client";

import {
  getCollaborationApplicantsAction,
  getCollaborationApplicantsRoleStatsAction,
  reviewCollaborationApplicantAction,
} from "@/actions/collaboration.action";
import UserProfileImg from "@/components/others/UserProfileImg";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { format } from "date-fns";
import { Search, Star } from "lucide-react";
import Link from "next/link";
import { useState, useTransition } from "react";
import { toast } from "sonner";

const PAGE_SIZE = 20;

const FILTERS = [
  { key: "ALL", label: "Applicants", countKey: "totalApplicants" },
  { key: "INVITED", label: "Invitees", countKey: "totalInvites" },
  { key: "SHORTLISTED", label: "Shortlisted", countKey: "totalShortlisted" },
  { key: "FINALIZED", label: "Finalized", countKey: "totalFinalized" },
  { key: "REJECTED", label: "Rejected", countKey: "totalRejected" },
];

function formatDate(value?: string) {
  if (!value) return "-";

  try {
    return format(new Date(value), "dd-MM-yyyy");
  } catch {
    return "-";
  }
}

export default function CollaborationApplicantsByRole({
  collaborationId,
  roleId,
  role,
  initialStats,
  initialApplicants,
}: {
  collaborationId: string;
  roleId: string;
  role: any;
  initialStats: any;
  initialApplicants: any[];
}) {
  const [stats, setStats] = useState(initialStats || {});
  const [applicants, setApplicants] = useState(initialApplicants || []);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("ALL");
  const [pageNo, setPageNo] = useState(1);
  const [hasMore, setHasMore] = useState((initialApplicants || []).length >= PAGE_SIZE);
  const [pending, startTransition] = useTransition();

  const reloadStats = async () => {
    const nextStats = await getCollaborationApplicantsRoleStatsAction(collaborationId, roleId);
    setStats(nextStats || {});
  };

  const loadApplicants = (nextFilter = filter, nextPage = 1, append = false, searchValue = search) => {
    startTransition(async () => {
      const response = await getCollaborationApplicantsAction(collaborationId, {
        filter: nextFilter,
        roleId,
        pageNo: nextPage,
        pageSize: PAGE_SIZE,
        search: searchValue,
      });

      const nextApplicants = Array.isArray(response?.response) ? response.response : [];

      setApplicants((prev) =>
        append
          ? [...prev, ...nextApplicants.filter((item) => !prev.some((prevItem) => prevItem?.applicationId === item?.applicationId))]
          : nextApplicants
      );
      setPageNo(nextPage);
      setHasMore(nextApplicants.length >= PAGE_SIZE);
    });
  };

  const handleReview = (item: any, action: string) => {
    startTransition(async () => {
      const response = await reviewCollaborationApplicantAction(collaborationId, {
        collaborationRoleId: item?.roleId,
        applicantId: item?.applicant?.id || item?.applicant?._id,
        action,
      });

      if (response?.status === "7400") {
        toast.success(response?.message || "Applicant updated");
        await reloadStats();
        loadApplicants(filter, 1, false, search);
        return;
      }

      toast.error(response?.message || "Failed to update applicant");
    });
  };

  return (
    <section className="flex w-full max-w-7xl flex-col gap-5 px-4 py-6 sm:px-6">
      <div className="rounded-[32px] border border-dark-300 bg-dark-250 p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-light-500">Role Applicants</p>
            <h1 className="pt-2 text-3xl font-semibold text-light-900">{role?.name || "Role"}</h1>
            <p className="pt-2 text-sm text-light-500">{role?.subtitle || "Review applicants for this specific role."}</p>
          </div>
          <div className="flex gap-2">
            <Link href={`/collaboration/${collaborationId}/roles/${roleId}/schedule`}>
              <Button type="button" className="rounded-full bg-dark-200 text-light-900 hover:bg-dark-300">
                View Schedule
              </Button>
            </Link>
            <Link href={`/collaboration/${collaborationId}`}>
              <Button type="button" className="rounded-full bg-dark-200 text-light-900 hover:bg-dark-300">
                Back
              </Button>
            </Link>
          </div>
        </div>
      </div>

      <div className="rounded-[32px] border border-dark-300 bg-dark-250 p-5">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
          {FILTERS.map((item) => (
            <button
              key={item.key}
              type="button"
              onClick={() => {
                setFilter(item.key);
                setSearch("");
                loadApplicants(item.key, 1, false, "");
              }}
              className={`rounded-[24px] border p-4 text-left transition ${filter === item.key ? "border-primary-500 bg-primary-500/10" : "border-dark-300 bg-dark-200 hover:border-primary-500/40"}`}
            >
              <p className="text-sm font-semibold text-light-900">
                {Number(stats?.[item.countKey] || 0)} {item.label}
              </p>
            </button>
          ))}
        </div>

        <div className="relative mt-4">
          <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-light-500" />
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search for people who have applied"
            className="h-12 rounded-full border-dark-300 bg-dark-200 pl-11 text-light-900 placeholder:text-light-500"
          />
        </div>
        <div className="pt-3">
          <Button
            type="button"
            disabled={pending}
            className="rounded-full bg-primary-500 text-light-900"
            onClick={() => loadApplicants(filter, 1, false)}
          >
            Search
          </Button>
        </div>
      </div>

      <div className="grid gap-4">
        {applicants.map((item: any, index: number) => (
          <div
            key={item?.applicationId || `applicant-${index}`}
            className="rounded-[28px] border border-dark-300 bg-dark-250 p-4"
          >
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div className="flex min-w-0 items-center gap-3">
                <UserProfileImg
                  src={item?.applicant?.profileImage || null}
                  userName={item?.applicant?.userName || "Applicant"}
                  className="size-12 min-h-12 min-w-12"
                />
                <div className="min-w-0">
                  <p className="truncate text-base font-semibold text-primary-500">
                    {item?.applicant?.userName || "Applicant"}
                  </p>
                  <p className="truncate text-sm text-light-500">
                    {item?.applicant?.professional || "Talent profile"}
                  </p>
                  <p className="pt-1 text-xs text-light-500">Applied on {formatDate(item?.appliedOn)}</p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                {Number(item?.applicant?.avgRating || 0) > 0 ? (
                  <div className="flex items-center gap-1 rounded-full bg-dark-200 px-3 py-1 text-xs text-light-900">
                    <Star className="size-3.5 fill-custom-100 text-custom-100" />
                    {Number(item?.applicant?.avgRating).toFixed(1)}
                    <span className="text-light-500">({Number(item?.applicant?.numberOfRating || 0)})</span>
                  </div>
                ) : null}

                <span className="rounded-full border border-dark-300 bg-dark-200 px-3 py-1 text-xs text-light-500">
                  {item?.applicantStatus || "APPLIED"}
                </span>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-end gap-2 pt-4">
              <Link href={`/collaboration/${collaborationId}/applicants/${item?.applicationId}`}>
                <Button type="button" className="rounded-full bg-dark-200 text-light-900 hover:bg-dark-300">
                  Review
                </Button>
              </Link>
              {(item?.applicant?.id || item?.applicant?._id) ? (
                <Link href={`/profile/${item?.applicant?.userName}/${item?.applicant?.id || item?.applicant?._id}`}>
                  <Button type="button" className="rounded-full bg-dark-200 text-light-900 hover:bg-dark-300">
                    View Profile
                  </Button>
                </Link>
              ) : null}
              {(item?.applicantStatus === "SHORTLISTED" || item?.applicantStatus === "ACCEPTED" || item?.applicantStatus === "FINALIZED") &&
              (item?.applicant?.id || item?.applicant?._id) ? (
                <Link href={`/chat/start/${item?.applicant?.id || item?.applicant?._id}`}>
                  <Button type="button" className="rounded-full bg-dark-200 text-custom-100 hover:bg-dark-300">
                    Chat
                  </Button>
                </Link>
              ) : null}
              {item?.applicantType === "APPLIED" && item?.applicantStatus === "APPLIED" ? (
                <Button type="button" disabled={pending} className="rounded-full bg-primary-500 text-light-900" onClick={() => handleReview(item, "ACCEPT")}>
                  Accept Request
                </Button>
              ) : null}
              {(item?.applicantStatus === "SHORTLISTED" || item?.applicantStatus === "ACCEPTED" || item?.applicantStatus === "FINALIZED") ? (
                <Button type="button" disabled={pending} className="rounded-full bg-dark-200 text-custom-100 hover:bg-dark-300" onClick={() => handleReview(item, "REJECT")}>
                  Add to Rejected
                </Button>
              ) : null}
            </div>
          </div>
        ))}

        {applicants.length === 0 ? (
          <div className="rounded-[28px] border border-dashed border-dark-300 bg-dark-250 px-4 py-12 text-center text-sm text-light-500">
            {pending ? "Loading applicants..." : "No applicants found for this role."}
          </div>
        ) : null}

        {applicants.length > 0 && hasMore ? (
          <Button
            type="button"
            disabled={pending}
            className="mx-auto rounded-full bg-dark-200 text-light-900 hover:bg-dark-300"
            onClick={() => loadApplicants(filter, pageNo + 1, true)}
          >
            {pending ? "Loading..." : "Load More"}
          </Button>
        ) : null}
      </div>
    </section>
  );
}
