"use client";

import UserProfileImg from "@/components/others/UserProfileImg";
import { format } from "date-fns";
import Link from "next/link";

function getDurationLabel(item: any) {
  const collaboration = item?.collaboration || {};

  if (collaboration?.expectedDays) {
    return `${collaboration.expectedDays}`;
  }

  if (collaboration?.expectedStartDate && collaboration?.expectedEndDate) {
    try {
      return `${format(new Date(collaboration.expectedStartDate), "dd MMM yyyy")} - ${format(
        new Date(collaboration.expectedEndDate),
        "dd MMM yyyy"
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
  const collaborationInfo = collaboration?.collaboration || {};
  const owner = collaboration?.owner || {};

  return (
    <Link
      href={`/collaboration/${collaborationInfo?._id || collaborationInfo?.id || collaboration?._id || ""}`}
      className="block rounded-[28px] border border-dark-300 bg-dark-250 p-4 transition hover:border-primary-500/40 hover:bg-dark-200"
    >
      <div className="flex items-center gap-3">
        <UserProfileImg
          src={owner?.profileImage || owner?.personalInfo?.profileImage || null}
          userName={owner?.userName || "User"}
        />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-primary-500">
            {owner?.userName || "Unknown user"}
          </p>
          <p className="truncate text-xs text-light-500">
            {owner?.professional || owner?.personalInfo?.professional || "Collaboration owner"}
          </p>
        </div>
        <span className="shrink-0 text-xs text-light-500">{collaboration?.timeAgo || ""}</span>
      </div>

      {collaborationInfo?.poster?.url ? (
        <div className="mt-4 overflow-hidden rounded-[24px] bg-black">
          <img
            src={collaborationInfo.poster.url}
            alt={collaborationInfo?.title || "Collaboration poster"}
            className="h-64 w-full object-contain"
          />
        </div>
      ) : null}

      <div className="pt-4">
        <h3 className="text-lg font-semibold text-light-900">
          {collaborationInfo?.title || "Untitled collaboration"}
        </h3>
        <p className="line-clamp-3 pt-2 text-sm text-light-500">
          {collaborationInfo?.description || "No collaboration description provided yet."}
        </p>
      </div>

      <div className="grid gap-2 pt-4 text-sm sm:grid-cols-3">
        <div>
          <p className="text-xs uppercase tracking-[0.14em] text-light-500">Location</p>
          <p className="pt-1 text-light-900">{collaborationInfo?.location || "-"}</p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-[0.14em] text-light-500">Duration</p>
          <p className="pt-1 text-light-900">{getDurationLabel(collaboration)}</p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-[0.14em] text-light-500">Expires on</p>
          <p className="pt-1 text-custom-100">{getDeadlineLabel(collaborationInfo?.deadlineToApply)}</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 pt-4">
        {collaboration?.rolesCount > 0 ? (
          <span className="rounded-full border border-dark-300 bg-dark-200 px-3 py-1 text-xs text-light-900">
            {collaboration.rolesCount} {collaboration.rolesCount > 1 ? "Roles" : "Role"}
          </span>
        ) : null}
        {collaborationInfo?.productionInfo?.type ? (
          <span className="rounded-full border border-dark-300 bg-dark-200 px-3 py-1 text-xs text-light-500">
            {collaborationInfo.productionInfo.type}
          </span>
        ) : null}
      </div>
    </Link>
  );
}

export default CollaborationCard;
