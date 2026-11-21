"use client";

import {
  getCollaborationApplicantDetailsAction,
  reviewCollaborationApplicantAction,
} from "@/actions/collaboration.action";
import UserProfileImg from "@/components/others/UserProfileImg";
import { Button } from "@/components/ui/button";
import { FileText, Star } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { useCollaborationWrite } from "@/lib/hooks/useCollaborationWorkflow";
import {
  applicantIdentity,
  applicantStatusLabel,
  reviewStatuses,
} from "@/lib/utils/collaboration-workflow";
import { collaborationSelection } from "@/lib/utils/collaboration-editor";
import CollaborationReviewButtons from "./CollaborationReviewButtons";

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
  const write = useCollaborationWrite(collaborationId + applicationId);
  const [refreshError, setRefreshError] = useState("");
  const reload = async () => {
    try {
      const next = await getCollaborationApplicantDetailsAction(
        collaborationId,
        applicationId,
      );
      if (!next) throw new Error();
      setApplication(next);
      setRefreshError("");
    } catch {
      setRefreshError(
        "Unable to refresh applicant details. Your saved changes have been retained.",
      );
    }
  };
  const review = (action: string) =>
    write.run(
      () =>
        reviewCollaborationApplicantAction(collaborationId, {
          collaborationRoleId: collaborationSelection(application?.roleId),
          applicantId: applicantIdentity(application),
          action,
        }),
      async () => {
        setApplication((previous: any) => ({
          ...previous,
          applicantStatus: reviewStatuses[action],
        }));
        await reload();
      },
    );

  if (!application) {
    return (
      <section className="flex w-full max-w-5xl justify-center px-4 py-10 sm:px-6">
        <div className="w-full rounded-[32px] border border-dark-300 bg-dark-250 px-4 py-12 text-center text-sm text-light-500">
          Unable to load applicant details.
          <Button type="button" onClick={reload}>
            Try again
          </Button>
        </div>
      </section>
    );
  }

  return (
    <section className="flex w-full max-w-5xl flex-col gap-5 px-4 py-6 sm:px-6">
      <Link
        href={`/collaboration/${collaborationId}/applicants`}
        className="text-sm text-primary-500 underline"
      >
        Back to applicants
      </Link>
      <p role="status" className="text-sm text-light-700">
        {applicantStatusLabel(application)}
      </p>
      {write.error ? <p role="alert">{write.error}</p> : null}
      {refreshError ? (
        <div role="alert">
          {refreshError}
          <Button type="button" disabled={write.pending} onClick={reload}>
            Retry loading
          </Button>
        </div>
      ) : null}
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
                {typeof application?.applicant?.professional === "string"
                  ? application.applicant.professional
                  : application?.applicant?.professional?.professional || ""}
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
          <p className="text-2xl font-semibold text-light-900">
            {application?.roleName}
          </p>
          <p className="pt-1 text-sm text-light-500">
            {application?.subtitle || ""}
          </p>
        </div>

        <div className="flex flex-wrap gap-2 pt-5">
          <CollaborationReviewButtons
            application={application}
            pending={write.pending}
            onReview={review}
          />
          {application?.applicant?.userName && application?.applicantId ? (
            <Link
              href={`/profile/${application.applicant.userName}/${application.applicantId}`}
            >
              <Button
                type="button"
                className="rounded-full bg-dark-200 text-light-900 hover:bg-dark-300"
              >
                View Profile
              </Button>
            </Link>
          ) : null}
        </div>
      </div>

      {["applicantName", "applicantEmail", "applicantPhone"].some(
        (key) => application?.[key],
      ) ? (
        <div className="grid gap-2 rounded-3xl border border-dark-300 bg-dark-250 p-5 text-sm text-light-700">
          <h2 className="font-semibold">Contact details</h2>
          <p>{application.applicantName}</p>
          <p>{application.applicantEmail}</p>
          <p>{application.applicantPhone}</p>
        </div>
      ) : null}
      {typeof application?.resumeFileUrl === "string" &&
      /^https?:\/\//i.test(application.resumeFileUrl) ? (
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
            <a
              href={application.resumeFileUrl}
              target="_blank"
              className="text-sm text-custom-100"
              rel="noreferrer"
            >
              Open
            </a>
          </div>
        </div>
      ) : null}

      {application?.message ? (
        <div className="rounded-[28px] border border-dark-300 bg-dark-250 p-5">
          <p className="text-lg font-semibold text-light-900">
            Why You Should Collab With Me
          </p>
          <p className="pt-3 text-sm text-light-500">{application.message}</p>
        </div>
      ) : null}

      {Array.isArray(application?.bestWork) &&
      application.bestWork.length > 0 ? (
        <div className="rounded-[28px] border border-dark-300 bg-dark-250 p-5">
          <p className="text-lg font-semibold text-light-900">Best Works</p>
          <div className="mt-4 flex gap-3 overflow-x-auto pb-1">
            {application.bestWork.map((item: any, index: number) => (
              <Link
                key={`best-work-${index}`}
                href={`/post/${item?._id || item?.postId || ""}`}
                className="block size-24 shrink-0 overflow-hidden rounded-2xl border border-dark-300 bg-dark-200"
              >
                {item?.media?.[0]?.url ? (
                  <Image
                    src={item.media[0].url}
                    alt={item?.about?.title || "Best work"}
                    className="size-full object-cover"
                    width={100}
                    height={100}
                  />
                ) : (
                  <div className="flex size-full items-center justify-center px-2 text-center text-[10px] text-light-500">
                    Best work
                  </div>
                )}
              </Link>
            ))}
          </div>
        </div>
      ) : null}

      <div className="rounded-[28px] border border-dark-300 bg-dark-250 p-5">
        <p className="text-lg font-semibold text-light-900">
          Profile Description
        </p>
        <p className="pt-3 text-sm text-light-500">
          {application?.applicant?.shortBio || "No bio available."}
        </p>
      </div>
    </section>
  );
}
