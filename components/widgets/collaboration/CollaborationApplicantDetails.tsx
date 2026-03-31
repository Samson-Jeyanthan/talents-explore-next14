"use client";

import {
  getCollaborationApplicantDetailsAction,
  reviewCollaborationApplicantAction,
} from "@/actions/collaboration.action";
import UserProfileImg from "@/components/others/UserProfileImg";
import { Button } from "@/components/ui/button";
import { FileText, Star } from "lucide-react";
import Link from "next/link";
import { useState, useTransition } from "react";
import { toast } from "sonner";

export default function CollaborationApplicantDetails({
  collaborationId,
  applicationId,
  initialApplication,
}: {
  collaborationId: string;
  applicationId: string;
  initialApplication: any;
}) {
  const [application, setApplication] = useState(initialApplication);
  const [pending, startTransition] = useTransition();

  const reload = async () => {
    const next = await getCollaborationApplicantDetailsAction(collaborationId, applicationId);
    setApplication(next);
  };

  const review = (action: string) =>
    startTransition(async () => {
      const res = await reviewCollaborationApplicantAction(collaborationId, {
        collaborationRoleId: application?.roleId,
        applicantId: application?.applicantId,
        action,
      });
      if (res?.status === "7400") {
        toast.success(res?.message || "Applicant updated");
        await reload();
        return;
      }
      toast.error(res?.message || "Failed to update applicant");
    });

  if (!application) {
    return (
      <section className="flex w-full max-w-5xl justify-center px-4 py-10 sm:px-6">
        <div className="w-full rounded-[32px] border border-dark-300 bg-dark-250 px-4 py-12 text-center text-sm text-light-500">
          No details found for this applicant.
        </div>
      </section>
    );
  }

  return (
    <section className="flex w-full max-w-5xl flex-col gap-5 px-4 py-6 sm:px-6">
      <div className="rounded-[32px] border border-dark-300 bg-dark-250 p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex items-center gap-3">
            <UserProfileImg
              src={application?.applicant?.profileImage || null}
              userName={application?.applicant?.userName || "Applicant"}
              className="size-14 min-h-14 min-w-14"
            />
            <div>
              <p className="text-xl font-semibold text-primary-500">
                {application?.applicant?.userName || "Applicant"}
              </p>
              <p className="text-sm text-light-500">
                {application?.applicant?.professional || ""}
              </p>
            </div>
          </div>

          {Number(application?.applicant?.avgRating || 0) > 0 ? (
            <div className="flex items-center gap-1 rounded-full bg-dark-200 px-3 py-1 text-sm text-light-900">
              <Star className="size-4 fill-custom-100 text-custom-100" />
              {Number(application?.applicant?.avgRating).toFixed(1)}
              <span className="text-light-500">
                ({Number(application?.applicant?.numberOfRating || 0)})
              </span>
            </div>
          ) : null}
        </div>

        <div className="pt-5">
          <p className="text-2xl font-semibold text-light-900">{application?.roleName}</p>
          <p className="pt-1 text-sm text-light-500">{application?.subtitle || ""}</p>
        </div>

        <div className="flex flex-wrap gap-2 pt-5">
          {application?.applicantStatus === "ACCEPTED" ? (
            <Button type="button" disabled={pending} className="rounded-full bg-primary-500 text-light-900" onClick={() => review("SHORTLIST")}>
              Add to Shortlist
            </Button>
          ) : null}
          {application?.applicantStatus === "SHORTLISTED" ? (
            <>
              <Button type="button" disabled={pending} className="rounded-full bg-primary-500 text-light-900" onClick={() => review("FINALIZED")}>
                Add to Finalist
              </Button>
              <Button type="button" disabled={pending} className="rounded-full bg-dark-200 text-custom-100 hover:bg-dark-300" onClick={() => review("ACCEPT")}>
                Remove from Shortlist
              </Button>
            </>
          ) : null}
          {application?.applicantType === "APPLIED" && application?.applicantStatus === "APPLIED" ? (
            <Button type="button" disabled={pending} className="rounded-full bg-dark-200 text-custom-100 hover:bg-dark-300" onClick={() => review("ACCEPT")}>
              Accept Request
            </Button>
          ) : null}
          {application?.applicant?.userName && application?.applicantId ? (
            <Link href={`/profile/${application.applicant.userName}/${application.applicantId}`}>
              <Button type="button" className="rounded-full bg-dark-200 text-light-900 hover:bg-dark-300">
                View Profile
              </Button>
            </Link>
          ) : null}
        </div>
      </div>

      {application?.resumeFileUrl ? (
        <div className="rounded-[28px] border border-dark-300 bg-dark-250 p-5">
          <div className="flex items-center gap-3">
            <div className="flex size-14 items-center justify-center rounded-2xl bg-custom-100 text-light-900">
              <FileText className="size-7" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm text-light-900">
                {application?.resumeFileKey?.split("/")?.pop() || "Resume"}
              </p>
            </div>
            <a href={application.resumeFileUrl} target="_blank" className="text-sm text-custom-100" rel="noreferrer">
              Open
            </a>
          </div>
        </div>
      ) : null}

      {application?.message ? (
        <div className="rounded-[28px] border border-dark-300 bg-dark-250 p-5">
          <p className="text-lg font-semibold text-light-900">Why You Should Collab With Me</p>
          <p className="pt-3 text-sm text-light-500">{application.message}</p>
        </div>
      ) : null}

      {Array.isArray(application?.bestWork) && application.bestWork.length > 0 ? (
        <div className="rounded-[28px] border border-dark-300 bg-dark-250 p-5">
          <p className="text-lg font-semibold text-light-900">Best Works</p>
          <div className="mt-4 flex gap-3 overflow-x-auto pb-1">
            {application.bestWork.map((item: any, index: number) => (
              <Link
                key={`best-work-${index}`}
                href={`/post/${item?._id || item?.postId || ""}`}
                className="block h-24 w-24 shrink-0 overflow-hidden rounded-2xl border border-dark-300 bg-dark-200"
              >
                {item?.media?.[0]?.url ? (
                  <img src={item.media[0].url} alt={item?.about?.title || "Best work"} className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center px-2 text-center text-[10px] text-light-500">
                    Best work
                  </div>
                )}
              </Link>
            ))}
          </div>
        </div>
      ) : null}

      <div className="rounded-[28px] border border-dark-300 bg-dark-250 p-5">
        <p className="text-lg font-semibold text-light-900">Profile Description</p>
        <p className="pt-3 text-sm text-light-500">{application?.applicant?.shortBio || "No bio available."}</p>
      </div>
    </section>
  );
}
