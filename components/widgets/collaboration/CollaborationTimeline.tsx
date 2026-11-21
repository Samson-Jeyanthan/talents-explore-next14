"use client";
import { useEffect, useState } from "react";
import {
  detailText,
  enumLabel,
  formatScheduleValue,
  timelineItems,
  scheduleMapLink,
} from "@/lib/utils/collaboration-schedule";

export default function CollaborationTimeline({ role }: { role: any }) {
  const [zone, setZone] = useState("UTC");
  useEffect(() => {
    setZone(Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC");
  }, []);
  const items = timelineItems(role);
  return (
    <div className="grid min-w-0 gap-4">
      <p className="text-xs text-light-600">Dates and times shown in {zone}.</p>
      {items.map((item: any, index: number) => {
        const type = ["DATE_SETS", "BY_DATE", "BY_DAYS"].includes(
          role?.timeLineType,
        )
          ? role.timeLineType
          : item?.date
            ? "DATE_SETS"
            : item?.startDate
              ? "BY_DATE"
              : "BY_DAYS";
        const duration = detailText(item?.expectedDays, "Not provided");
        const map = scheduleMapLink(item);
        return (
          <article
            key={index}
            className="min-w-0 rounded-2xl border border-dark-300 bg-dark-250 p-4"
          >
            <h3 className="break-words text-base font-semibold text-light-900">
              {detailText(item?.title, `Schedule ${index + 1}`)}
            </h3>
            <dl className="mt-3 grid gap-4 text-sm sm:grid-cols-2">
              {type === "DATE_SETS" ? (
                <>
                  <div>
                    <dt className="text-light-600">Date</dt>
                    <dd className="mt-1 text-light-900">
                      {formatScheduleValue(item?.date, "date", zone)}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-light-600">Time</dt>
                    <dd className="mt-1 text-light-900">
                      {formatScheduleValue(item?.startTime, "time", zone)} –{" "}
                      {formatScheduleValue(item?.endTime, "time", zone)}
                    </dd>
                  </div>
                </>
              ) : null}
              {type === "BY_DATE" ? (
                <>
                  <div>
                    <dt className="text-light-600">Start</dt>
                    <dd className="mt-1 text-light-900">
                      {formatScheduleValue(item?.startDate, "datetime", zone)}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-light-600">End</dt>
                    <dd className="mt-1 text-light-900">
                      {formatScheduleValue(item?.endDate, "datetime", zone)}
                    </dd>
                  </div>
                </>
              ) : null}
              {type === "BY_DAYS" ? (
                <div>
                  <dt className="text-light-600">Expected duration</dt>
                  <dd className="mt-1 text-light-900">
                    {/^\d+(\.\d+)?$/.test(duration)
                      ? `${duration} days`
                      : duration}
                  </dd>
                </div>
              ) : null}
              <div>
                <dt className="text-light-600">Mode</dt>
                <dd className="mt-1 text-light-900">{enumLabel(item?.mode)}</dd>
              </div>
              <div>
                <dt className="text-light-600">Location</dt>
                <dd className="mt-1 break-words text-light-900">
                  {detailText(item?.location, "Not provided")}
                </dd>
                {map ? (
                  <a
                    href={map}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-1 inline-block text-primary-500 underline"
                  >
                    View on map
                  </a>
                ) : null}
              </div>
            </dl>
            {detailText(item?.description, "") ? (
              <p className="mt-4 whitespace-pre-wrap break-words text-sm text-light-700">
                {detailText(item.description)}
              </p>
            ) : null}
          </article>
        );
      })}
      {!items.length ? (
        <p className="rounded-2xl border border-dashed border-dark-300 p-6 text-sm text-light-600">
          No schedule has been added for this role.
        </p>
      ) : null}
    </div>
  );
}
