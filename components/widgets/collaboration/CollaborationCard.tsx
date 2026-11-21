"use client";

import UserProfileImg from "@/components/others/UserProfileImg";
import { format } from "date-fns";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

function getDurationLabel(item: any) {
  const collaboration = item?.collaboration || item || {};

  if (collaboration?.expectedDays) {
    const duration = String(collaboration.expectedDays);
    return /^\d+(\.\d+)?$/.test(duration) ? `${duration} days` : duration;
  }

  if (collaboration?.expectedStartDate && collaboration?.expectedEndDate) {
    try {
      return `${format(new Date(collaboration.expectedStartDate), "dd MMM yyyy")} - ${format(
        new Date(collaboration.expectedEndDate),
        "dd MMM yyyy",
      )}`;
    } catch {
      return "-";
    }
  }

  return "-";
}

function getDeadlineLabel(value?: string) {
  if (!value) {
    return "-";
  }

  try {
    return format(new Date(value), "dd MMM yyyy");
  } catch {
    return "-";
  }
}

function CollaborationCard({ collaboration }: { collaboration: any }) {
  const collaborationInfo = collaboration?.collaboration || collaboration || {};
  const owner = collaboration?.owner || {};
  const professional =
    typeof owner?.professional === "string"
      ? owner.professional
      : typeof owner?.professional?.professional === "string"
        ? owner.professional.professional
        : typeof owner?.personalInfo?.professional === "string"
          ? owner.personalInfo.professional
          : "Collaboration owner";

  const [failedImage, setFailedImage] = useState<string | null>(null);
  const poster = collaborationInfo?.poster;
  const candidate =
    poster?.mediaType === "video" ? poster?.thumbnailUrl : poster?.url;
  const source = typeof candidate === "string" ? candidate.trim() : "";
  const posterUrl = /^(https?:\/\/|\/|data:image\/)/i.test(source)
    ? source
    : "";
  const hasPoster = !!source || poster?.mediaType === "video";
  const showImage = !!posterUrl && failedImage !== posterUrl;
  const title = collaborationInfo?.title || "Untitled collaboration";

  return (
    <Link
      href={`/collaboration/${collaborationInfo?._id || collaborationInfo?.id || collaboration?._id || ""}`}
      aria-label={`View collaboration: ${title}`}
      className="group block min-w-0 overflow-hidden rounded-3xl border border-dark-400/50 bg-dark-250 shadow-sm transition duration-200 hover:border-primary-500/40 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 focus-visible:ring-offset-dark-200"
    >
      <div
        className={`grid min-w-0 ${hasPoster ? "md:grid-cols-[220px_minmax(0,1fr)] xl:grid-cols-[240px_minmax(0,1fr)]" : ""}`}
      >
        {hasPoster ? (
          <div className="relative aspect-[4/3] overflow-hidden border-b border-dark-400/40 bg-dark-200 md:aspect-auto md:min-h-[300px] md:border-b-0 md:border-r">
            {showImage ? (
              <Image
                src={posterUrl}
                alt={`Poster for ${title}`}
                fill
                sizes="(min-width: 1300px) 240px, (min-width: 768px) 220px, (max-width: 640px) 100vw, 640px"
                className="object-contain p-3 sm:p-4"
                onError={() => setFailedImage(posterUrl)}
              />
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-6 text-light-500">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  aria-hidden="true"
                  className="size-9"
                >
                  <rect x="3" y="3" width="18" height="18" rx="4" />
                  <circle cx="8" cy="8" r="1.5" />
                  <path d="m3 17 5-5 4 4 4-6 5 7" />
                </svg>
                <span className="text-xs">Preview unavailable</span>
              </div>
            )}
          </div>
        ) : null}
        <div className="flex min-w-0 flex-col p-4 sm:p-5 lg:p-6">
          <div className="flex min-w-0 items-center gap-3">
            <UserProfileImg
              src={
                owner?.profileImage || owner?.personalInfo?.profileImage || null
              }
              userName={owner?.userName || "User"}
              className="size-9 min-h-9 min-w-9"
            />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-light-900">
                {owner?.userName || "Unknown user"}
              </p>
              <p className="truncate text-xs text-light-500">{professional}</p>
            </div>
            {collaboration?.timeAgo ? (
              <span className="shrink-0 text-xs text-light-500">
                {collaboration.timeAgo}
              </span>
            ) : null}
          </div>
          <h3 className="mt-4 break-words text-xl font-semibold leading-snug text-light-900 transition-colors group-hover:text-primary-500">
            {title}
          </h3>
          <p className="mt-2 line-clamp-2 break-words text-sm leading-relaxed text-light-600">
            {collaborationInfo?.description ||
              "No collaboration description provided yet."}
          </p>
          <dl className="my-5 grid min-w-0 grid-cols-2 gap-x-4 gap-y-3 text-sm sm:grid-cols-3">
            <div className="min-w-0">
              <dt className="text-xs text-light-500">Location</dt>
              <dd className="mt-1 break-words font-medium text-light-800">
                {collaborationInfo?.location || "Not specified"}
              </dd>
            </div>
            <div className="min-w-0">
              <dt className="text-xs text-light-500">Duration</dt>
              <dd className="mt-1 break-words font-medium text-light-800">
                {getDurationLabel(collaboration)}
              </dd>
            </div>
            <div className="min-w-0">
              <dt className="text-xs text-light-500">Apply by</dt>
              <dd className="mt-1 break-words font-medium text-light-800">
                {getDeadlineLabel(collaborationInfo?.deadlineToApply)}
              </dd>
            </div>
          </dl>
          <div className="mt-auto flex flex-wrap items-center justify-between gap-3 border-t border-dark-400/40 pt-4">
            <div className="flex min-w-0 flex-wrap gap-2">
              {collaboration?.rolesCount > 0 ? (
                <span className="rounded-full bg-primary-500/10 px-3 py-1 text-xs font-medium text-primary-500">
                  {collaboration.rolesCount}{" "}
                  {collaboration.rolesCount === 1 ? "role" : "roles"}
                </span>
              ) : null}
              {collaborationInfo?.productionInfo?.type ? (
                <span className="max-w-full break-words rounded-full border border-dark-400/50 px-3 py-1 text-xs text-light-600">
                  {collaborationInfo.productionInfo.type}
                </span>
              ) : null}
            </div>
            <span className="inline-flex items-center gap-2 text-sm font-semibold text-primary-500">
              View details{" "}
              <svg
                aria-hidden="true"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="size-4 transition-transform group-hover:translate-x-0.5"
              >
                <path d="M7 17 17 7M7 7h10v10" />
              </svg>
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}

export default CollaborationCard;
