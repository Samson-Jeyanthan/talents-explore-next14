import { collaborationSelection } from "./collaboration-editor";

export function detailText(value: any, fallback = "Not specified"): string {
  if (typeof value === "number" && Number.isFinite(value)) return String(value);
  if (typeof value !== "string") return fallback;
  const text = value.trim();
  return text && !["null", "undefined"].includes(text) ? text : fallback;
}
export function lookupLabel(value: any, keys: string[] = []): string {
  if (value && typeof value === "object") {
    for (const key of ["label", ...keys, "name", "title"]) {
      const label = detailText(value[key], "");
      if (label) return label;
    }
    return "Not specified";
  }
  const text = detailText(value);
  return /^[a-f\d]{24}$/i.test(text) ? "Not specified" : text;
}
export function enumLabel(value: any): string {
  const code = collaborationSelection(value);
  const labels: Record<string, string> = {
    PAID: "Paid",
    NON_PAID: "Non-paid",
    NEGOTIABLE: "Negotiable",
    EXPENSE_ONLY: "Expenses only",
    VOLUNTEER: "Volunteer",
    PER_HOUR: "Per hour",
    PER_DAY: "Per day",
    PER_WEEK: "Per week",
    PER_MONTH: "Per month",
    ONLINE: "Online",
    MEETUP: "Meetup",
    HYBRID: "Hybrid",
    DATE_SETS: "Scheduled dates",
    BY_DATE: "Date range",
    BY_DAYS: "Expected duration",
    male: "Male",
    female: "Female",
    other: "Other",
    prefferNotToSay: "Prefer not to say",
    beginner: "Beginner",
    intermediate: "Intermediate",
    advanced: "Advanced",
  };
  return labels[code] || lookupLabel(value);
}
export function timelineItems(role: any): any[] {
  return Array.isArray(role?.timeLine) ? role.timeLine : [];
}
export function paymentLabels(payment: any): string[] {
  if (!payment || typeof payment !== "object") return [];
  const labels: string[] = [];
  if (detailText(collaborationSelection(payment.payment), ""))
    labels.push(enumLabel(payment.payment));
  const amount = detailText(payment.amount, "");
  if (amount)
    labels.push(
      [amount, detailText(collaborationSelection(payment.currency), "")]
        .filter(Boolean)
        .join(" "),
    );
  const type = detailText(collaborationSelection(payment.type), "");
  if (type) labels.push(enumLabel(payment.type));
  return labels;
}
export function formatScheduleValue(
  value: any,
  kind: "date" | "time" | "datetime",
  timeZone = "UTC",
): string {
  if (typeof value !== "string" || !value.trim()) return "Not provided";
  if (kind === "time" && /^([01]\d|2[0-3]):[0-5]\d$/.test(value)) return value;
  const calendar = /^\d{4}-\d{2}-\d{2}$/.test(value);
  const date = new Date(calendar ? `${value}T12:00:00Z` : value);
  if (
    !Number.isFinite(date.getTime()) ||
    (calendar && date.toISOString().slice(0, 10) !== value)
  )
    return "Not provided";
  const options: Intl.DateTimeFormatOptions = {
    timeZone: calendar ? "UTC" : timeZone,
  };
  if (kind !== "time")
    Object.assign(options, { day: "2-digit", month: "short", year: "numeric" });
  if (kind !== "date")
    Object.assign(options, {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  try {
    return new Intl.DateTimeFormat("en-GB", options).format(date);
  } catch {
    return "Not provided";
  }
}
export function canUseCollaborationChat(viewer: any, details: any): boolean {
  const id = collaborationSelection(viewer);
  if (!id) return false;
  if (id === collaborationSelection(details?.owner)) return true;
  return (Array.isArray(details?.roles) ? details.roles : []).some(
    (role: any) =>
      ["ACCEPTED", "SHORTLISTED", "FINALIZED"].includes(
        role?.myApplicant?.applicantStatus,
      ),
  );
}
export function groupMemberAllowed(viewer: any, members: any[]): boolean {
  const id = collaborationSelection(viewer);
  return (
    !!id &&
    Array.isArray(members) &&
    members.some((member) => collaborationSelection(member?.userId) === id)
  );
}
export function scheduleMapLink(item: any): string | null {
  if (enumLabel(item?.mode) === "Online") return null;
  const coordinates = item?.gpsLocation?.coordinates;
  const longitude = coordinates?.[0] ?? item?.longitude;
  const latitude = coordinates?.[1] ?? item?.latitude;
  if (
    typeof latitude === "number" &&
    typeof longitude === "number" &&
    Number.isFinite(latitude) &&
    Number.isFinite(longitude) &&
    Math.abs(latitude) <= 90 &&
    Math.abs(longitude) <= 180
  )
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${latitude},${longitude}`)}`;
  const address = detailText(item?.location, "");
  return address
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`
    : null;
}
