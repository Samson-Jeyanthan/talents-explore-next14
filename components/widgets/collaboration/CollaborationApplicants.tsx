"use client";

import {
  getCollaborationApplicantsAction,
  getCollaborationApplicantsStatsAction,
  reviewCollaborationApplicantAction,
} from "@/actions/collaboration.action";
import UserProfileImg from "@/components/others/UserProfileImg";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { format } from "date-fns";
import { Search, Star } from "lucide-react";
import Link from "next/link";
import { useMemo, useState, useTransition } from "react";
import { toast } from "sonner";

type Props = {
  collaborationId: string;
  currentUser: any;
  collaborationDetails: any;
  initialStats: any;
  initialApplicants: any[];
};

const PAGE_SIZE = 20;

const FILTER_CARDS = [
  {
    key: "ALL",
    label: "Applicants",
    bgClass: "bg-dark-200",
    textClass: "text-light-900",
    countKey: "totalApplicants",
  },
  {
    key: "INVITED",
    label: "Invitees",
    bgClass: "bg-[rgba(49,114,223,0.1)]",
    textClass: "text-[#7fb0ff]",
    countKey: "totalInvites",
  },
  {
    key: "SHORTLISTED",
    label: "Shortlisted",
    bgClass: "bg-[rgba(224,156,46,0.1)]",
    textClass: "text-[#f6bf64]",
    countKey: "totalShortlisted",
  },
  {
    key: "FINALIZED",
    label: "Finalized",
    bgClass: "bg-[rgba(62,128,66,0.1)]",
    textClass: "text-[#7bd480]",
    countKey: "totalFinalized",
  },
  {
    key: "REJECTED",
    label: "Rejected",
    bgClass: "bg-[rgba(194,23,23,0.1)]",
    textClass: "text-[#ff8787]",
    countKey: "totalRejected",
  },
  {
    key: "ROLE",
    label: "Roles",
    bgClass: "bg-[rgba(120,100,233,0.1)]",
    textClass: "text-[#a895ff]",
    countKey: "totalRoles",
  },
];

function formatDate(value?: string) {
  if (!value) {
    return "-";
  }

  try {
    return format(new Date(value), "dd-MM-yyyy");
  } catch {
    return "-";
  }
}

function CollaborationApplicants({
  collaborationId,
  collaborationDetails,
  initialStats,
  initialApplicants,
}: Props) {
  const [stats, setStats] = useState(initialStats || {});
  const [activeFilter, setActiveFilter] = useState("ALL");
  const [search, setSearch] = useState("");
  const [applicants, setApplicants] = useState(initialApplicants || []);
  const [pageNo, setPageNo] = useState(1);
  const [hasMore, setHasMore] = useState((initialApplicants || []).length >= PAGE_SIZE);
  const [isPending, startTransition] = useTransition();

  const reloadStats = async () => {
    const nextStats = await getCollaborationApplicantsStatsAction(collaborationId);
    setStats(nextStats || {});
  };

  const loadApplicants = (filter: string, nextPage = 1, append = false, searchValue = search) => {
    startTransition(async () => {
      const response = await getCollaborationApplicantsAction(collaborationId, {
        filter,
        pageNo: nextPage,
        pageSize: PAGE_SIZE,
        search: searchValue,
      });

      if (response?.status !== "7400") {
        if (!append) {
          setApplicants([]);
        }
        setHasMore(false);
        return;
      }

      const nextApplicants = Array.isArray(response.response) ? response.response : [];

      setApplicants((prev) =>
        append
          ? [
              ...prev,
              ...nextApplicants.filter(
                (item) =>
                  !prev.some((prevItem) => prevItem?.applicationId === item?.applicationId)
              ),
            ]
          : nextApplicants
      );
      setPageNo(nextPage);
      setHasMore(nextApplicants.length >= PAGE_SIZE);
    });
  };

  const activeItems = useMemo(() => {
    const roleItems = Array.isArray(collaborationDetails?.roles)
      ? collaborationDetails.roles
      : [];

    if (activeFilter === "ROLE") {
      return roleItems;
    }

    return applicants;
  }, [activeFilter, applicants, collaborationDetails?.roles]);

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
        loadApplicants(activeFilter, 1, false);
        return;
      }

      toast.error(response?.message || "Failed to update applicant");
    });
  };

  return (
    <section className="flex w-full max-w-7xl flex-col gap-5 px-4 py-6 sm:px-6">
      <div className="rounded-[32px] border border-dark-300 bg-dark-250 p-5 sm:p-6">
        <h1 className="text-3xl font-semibold text-light-900">Applicants</h1>
        <p className="pt-2 text-sm text-light-500">
          Review applicants, invites, shortlisted talent, and role-wise demand for this collaboration.
        </p>
      </div>

      <div className="rounded-[32px] border border-dark-300 bg-dark-250 p-4 sm:p-5">
        <p className="pb-4 text-sm font-semibold uppercase tracking-[0.16em] text-light-500">
          Overview
        </p>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {FILTER_CARDS.map((item) => {
            const isActive = activeFilter === item.key;
            const count = Number(stats?.[item.countKey] || 0);

            return (
              <button
                key={item.key}
                type="button"
                onClick={() => {
                  setActiveFilter(item.key);
                  setPageNo(1);
                  if (item.key !== "ROLE") {
                    loadApplicants(item.key, 1, false, "");
                  }
                  setSearch("");
                }}
                className={`rounded-[24px] border p-4 text-left transition ${
                  isActive
                    ? "border-primary-500 bg-primary-500/10"
                    : "border-dark-300 bg-dark-200 hover:border-primary-500/40"
                }`}
              >
                <p className={`text-sm font-semibold ${item.textClass}`}>
                  {count} {item.label}
                </p>
              </button>
            );
          })}
        </div>

        {activeFilter !== "ROLE" ? (
          <div className="relative mt-4">
            <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-light-500" />
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search for people who have applied"
              className="h-12 rounded-full border-dark-300 bg-dark-200 pl-11 text-light-900 placeholder:text-light-500"
            />
            <div className="pt-3">
              <Button
                type="button"
                disabled={isPending}
                className="rounded-full bg-primary-500 text-light-900"
                onClick={() => loadApplicants(activeFilter, 1, false)}
              >
                Search
              </Button>
            </div>
          </div>
        ) : null}
      </div>

      <div className="grid gap-4">
        {activeItems.map((item: any, index: number) =>
          activeFilter === "ROLE" ? (
            <Link
              key={item?._id || `role-${index}`}
              href={`/collaboration/${collaborationId}/roles/${item?._id || item?.roleId}/applicants`}
              className="rounded-[28px] border border-dark-300 bg-dark-250 p-4"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-lg font-semibold text-primary-500">{item?.name || "Role"}</p>
                  <p className="pt-1 text-sm text-light-500">{item?.subtitle || ""}</p>
                </div>
                <span className="rounded-full border border-dark-300 bg-dark-200 px-3 py-1 text-xs text-light-500">
                  Role overview
                </span>
              </div>
              <p className="pt-3 text-sm text-light-500">
                {item?.description || "No role description provided yet."}
              </p>
            </Link>
          ) : (
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
                    <p className="pt-1 text-xs text-light-500">
                      Applied on {formatDate(item?.appliedOn)}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  {Number(item?.applicant?.avgRating || 0) > 0 ? (
                    <div className="flex items-center gap-1 rounded-full bg-dark-200 px-3 py-1 text-xs text-light-900">
                      <Star className="size-3.5 fill-custom-100 text-custom-100" />
                      {Number(item?.applicant?.avgRating).toFixed(1)}
                      <span className="text-light-500">
                        ({Number(item?.applicant?.numberOfRating || 0)})
                      </span>
                    </div>
                  ) : null}

                  <span className="rounded-full border border-dark-300 bg-dark-200 px-3 py-1 text-xs text-light-500">
                    {item?.applicantStatus || "APPLIED"}
                  </span>
                </div>
              </div>

              {Array.isArray(item?.bestWork) && item.bestWork.length > 0 ? (
                <div className="mt-4 flex gap-3 overflow-x-auto pb-1">
                  {item.bestWork.map((work: any, workIndex: number) => (
                    <Link
                      key={`${item?.applicationId}-work-${workIndex}`}
                      href={`/post/${work?._id || work?.postId || ""}`}
                      className="block h-24 w-24 shrink-0 overflow-hidden rounded-2xl border border-dark-300 bg-dark-200"
                    >
                      {work?.media?.[0]?.url ? (
                        <img
                          src={work.media[0].url}
                          alt={work?.about?.title || "Best work"}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center px-2 text-center text-[10px] text-light-500">
                          Best work
                        </div>
                      )}
                    </Link>
                  ))}
                </div>
              ) : null}

              <div className="flex flex-wrap items-center justify-end gap-2 pt-4">
                {(item?.applicantStatus === "SHORTLISTED" ||
                  item?.applicantStatus === "ACCEPTED" ||
                  item?.applicantStatus === "FINALIZED") &&
                (item?.applicant?.id || item?.applicant?._id) ? (
                  <Link href={`/chat/start/${item?.applicant?.id || item?.applicant?._id}`}>
                    <Button
                      type="button"
                      className="rounded-full bg-dark-200 text-custom-100 hover:bg-dark-300"
                    >
                      Chat
                    </Button>
                  </Link>
                ) : null}

                {item?.applicant?.userName && (item?.applicant?.id || item?.applicant?._id) ? (
                  <Link
                    href={`/collaboration/${collaborationId}/applicants/${item?.applicationId}`}
                  >
                    <Button
                      type="button"
                      className="rounded-full bg-dark-200 text-light-900 hover:bg-dark-300"
                    >
                      Review
                    </Button>
                  </Link>
                ) : null}

                {item?.applicant?.userName && (item?.applicant?.id || item?.applicant?._id) ? (
                  <Link
                    href={`/profile/${item.applicant.userName}/${item.applicant.id || item.applicant._id}`}
                  >
                    <Button
                      type="button"
                      className="rounded-full bg-dark-200 text-light-900 hover:bg-dark-300"
                    >
                      View Profile
                    </Button>
                  </Link>
                ) : null}

                {item?.applicantStatus === "ACCEPTED" ? (
                  <Button
                    type="button"
                    disabled={isPending}
                    className="rounded-full bg-dark-200 text-light-900 hover:bg-dark-300"
                    onClick={() => handleReview(item, "SHORTLIST")}
                  >
                    Add to Shortlisted
                  </Button>
                ) : null}

                {item?.applicantStatus === "SHORTLISTED" ? (
                  <>
                    <Button
                      type="button"
                      disabled={isPending}
                      className="rounded-full bg-primary-500 text-light-900"
                      onClick={() => handleReview(item, "FINALIZED")}
                    >
                      Add to Finalized
                    </Button>
                    <Button
                      type="button"
                      disabled={isPending}
                      className="rounded-full bg-dark-200 text-light-900 hover:bg-dark-300"
                      onClick={() => handleReview(item, "ACCEPT")}
                    >
                      Remove from Shortlisted
                    </Button>
                  </>
                ) : null}

                {item?.applicantStatus === "FINALIZED" ? (
                  <Button
                    type="button"
                    disabled={isPending}
                    className="rounded-full bg-dark-200 text-light-900 hover:bg-dark-300"
                    onClick={() => handleReview(item, "ACCEPT")}
                  >
                    Remove from Finalized
                  </Button>
                ) : null}

                {item?.applicantStatus === "REJECTED" ? (
                  <Button
                    type="button"
                    disabled={isPending}
                    className="rounded-full bg-dark-200 text-light-900 hover:bg-dark-300"
                    onClick={() => handleReview(item, "ACCEPT")}
                  >
                    Remove from Rejected
                  </Button>
                ) : null}

                {item?.applicantType === "APPLIED" && item?.applicantStatus === "APPLIED" ? (
                  <Button
                    type="button"
                    disabled={isPending}
                    className="rounded-full bg-primary-500 text-light-900"
                    onClick={() => handleReview(item, "ACCEPT")}
                  >
                    Accept Request
                  </Button>
                ) : null}

                {(item?.applicantStatus === "SHORTLISTED" ||
                  item?.applicantStatus === "ACCEPTED" ||
                  item?.applicantStatus === "FINALIZED") ? (
                  <Button
                    type="button"
                    disabled={isPending}
                    className="rounded-full bg-dark-200 text-custom-100 hover:bg-dark-300"
                    onClick={() => handleReview(item, "REJECT")}
                  >
                    Add to Rejected
                  </Button>
                ) : null}
              </div>
            </div>
          )
        )}

        {activeItems.length === 0 ? (
          <div className="rounded-[28px] border border-dashed border-dark-300 bg-dark-250 px-4 py-12 text-center text-sm text-light-500">
            {isPending ? "Loading applicants..." : "No applicants found."}
          </div>
        ) : null}

        {activeFilter !== "ROLE" && activeItems.length > 0 && hasMore ? (
          <Button
            type="button"
            disabled={isPending}
            className="mx-auto rounded-full bg-dark-200 text-light-900 hover:bg-dark-300"
            onClick={() => loadApplicants(activeFilter, pageNo + 1, true)}
          >
            {isPending ? "Loading..." : "Load More"}
          </Button>
        ) : null}
      </div>
    </section>
  );
}

export default CollaborationApplicants;
