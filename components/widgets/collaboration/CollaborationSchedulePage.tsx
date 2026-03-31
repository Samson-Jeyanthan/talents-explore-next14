"use client";

import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { CalendarDays, Clock3, MapPin } from "lucide-react";
import Link from "next/link";

function safeFormat(value?: string, formatText = "dd MMM yyyy, hh:mm a") {
  if (!value) return "-";

  try {
    return format(new Date(value), formatText);
  } catch {
    return "-";
  }
}

export default function CollaborationSchedulePage({
  collaborationId,
  role,
}: {
  collaborationId: string;
  role: any;
}) {
  const timeLine = Array.isArray(role?.timeLine) ? role.timeLine : [];

  return (
    <section className="flex w-full max-w-5xl flex-col gap-5 px-4 py-6 sm:px-6">
      <div className="rounded-[32px] border border-dark-300 bg-dark-250 p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-light-500">Role Schedule</p>
            <h1 className="pt-2 text-3xl font-semibold text-light-900">{role?.name || "Role"}</h1>
            <p className="pt-2 text-sm text-light-500">{role?.subtitle || "Scheduled dates and locations for this role."}</p>
          </div>
          <Link href={`/collaboration/${collaborationId}`}>
            <Button type="button" className="rounded-full bg-dark-200 text-light-900 hover:bg-dark-300">
              Back
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid gap-4">
        {timeLine.map((item: any, index: number) => (
          <div
            key={`${role?._id || role?.roleId || "role"}-timeline-${index}`}
            className="rounded-[28px] border border-dark-300 bg-dark-250 p-5"
          >
            <div className="grid gap-4 md:grid-cols-3">
              <div>
                <div className="flex items-center gap-2 text-light-500">
                  <CalendarDays className="size-4" />
                  <span className="text-xs uppercase tracking-[0.16em]">Date</span>
                </div>
                <p className="pt-2 text-sm text-light-900">
                  {item?.date ? safeFormat(item.date, "dd MMM yyyy") : item?.startDate ? `${safeFormat(item.startDate, "dd MMM yyyy")} - ${safeFormat(item.endDate, "dd MMM yyyy")}` : item?.expectedDays || "-"}
                </p>
              </div>
              <div>
                <div className="flex items-center gap-2 text-light-500">
                  <Clock3 className="size-4" />
                  <span className="text-xs uppercase tracking-[0.16em]">Time / Mode</span>
                </div>
                <p className="pt-2 text-sm text-light-900">
                  {item?.startTime || item?.endTime ? `${safeFormat(item.startTime)} - ${safeFormat(item.endTime)}` : role?.timeLineType || "-"}
                </p>
                <p className="pt-1 text-xs text-light-500">{item?.mode || "-"}</p>
              </div>
              <div>
                <div className="flex items-center gap-2 text-light-500">
                  <MapPin className="size-4" />
                  <span className="text-xs uppercase tracking-[0.16em]">Location</span>
                </div>
                <p className="pt-2 text-sm text-light-900">{item?.location || "-"}</p>
              </div>
            </div>
            {(item?.title || item?.description) ? (
              <div className="pt-4">
                <p className="text-sm font-semibold text-light-900">{item?.title || "Timeline note"}</p>
                <p className="pt-1 text-sm text-light-500">{item?.description || ""}</p>
              </div>
            ) : null}
          </div>
        ))}

        {timeLine.length === 0 ? (
          <div className="rounded-[28px] border border-dashed border-dark-300 bg-dark-250 px-4 py-12 text-center text-sm text-light-500">
            No scheduled dates found for this role.
          </div>
        ) : null}
      </div>
    </section>
  );
}
