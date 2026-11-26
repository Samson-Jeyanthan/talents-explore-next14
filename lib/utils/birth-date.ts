// Birthdays are calendar dates. Preserve the written date instead of converting
// it to the viewer's time zone.
export function getDaysInMonth(year: number, month: number): number {
  if (
    !Number.isInteger(year) ||
    year < 1 ||
    year > 9999 ||
    !Number.isInteger(month) ||
    month < 1 ||
    month > 12
  )
    return 0;
  const leap = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
  return [31, leap ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][
    month - 1
  ];
}

export function convertToISOString(
  year: string,
  month: string,
  day: string,
): string {
  if (
    !/^\d{4}$/.test(year) ||
    !/^\d{1,2}$/.test(month) ||
    !/^\d{1,2}$/.test(day)
  )
    return "";
  const maximum = getDaysInMonth(Number(year), Number(month));
  if (!maximum || Number(day) < 1 || Number(day) > maximum) return "";
  return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}T00:00:00.000Z`;
}

export function formatISOStringDate(value: string | undefined) {
  const empty = { year: "", month: "", day: "" };
  if (typeof value !== "string") return empty;
  if (!Number.isFinite(Date.parse(value))) return empty;
  const iso = /^(\d{4})-(\d{2})-(\d{2})(?:T.*)?$/.exec(value);
  // The API also returns Date.toString() values. Read their written calendar
  // date rather than converting the instant into the viewer's time zone.
  const legacy =
    /^(?:Sun|Mon|Tue|Wed|Thu|Fri|Sat) (Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec) (\d{2}) (\d{4}) (?:[01]\d|2[0-3]):[0-5]\d:[0-5]\d GMT[+-]\d{4}(?: \([^()]*\))?$/.exec(
      value,
    );
  if (!iso && !legacy) return empty;
  const year = iso ? iso[1] : legacy![3];
  const month = iso
    ? iso[2]
    : String(
        [
          "Jan",
          "Feb",
          "Mar",
          "Apr",
          "May",
          "Jun",
          "Jul",
          "Aug",
          "Sep",
          "Oct",
          "Nov",
          "Dec",
        ].indexOf(legacy![1]) + 1,
      ).padStart(2, "0");
  const day = iso ? iso[3] : legacy![2];
  if (!convertToISOString(year, month, day)) return empty;
  return { year, month, day };
}

export function normalizeProfileBirthDate(value: string | undefined) {
  const { year, month, day } = formatISOStringDate(value);
  return convertToISOString(year, month, day) || value || "";
}

export function profileBirthDateCutoff(minimumAge: number, today = new Date()) {
  const year = today.getUTCFullYear() - minimumAge;
  const month = today.getUTCMonth() + 1;
  const day = Math.min(today.getUTCDate(), getDaysInMonth(year, month));
  return convertToISOString(String(year), String(month), String(day)).slice(
    0,
    10,
  );
}

export function validProfileBirthDate(value: string, today = new Date()) {
  const parts = formatISOStringDate(value);
  if (!parts.year || !Number.isFinite(today.getTime())) return false;
  const year = Number(parts.year);
  const month = Number(parts.month);
  const day = Number(parts.day);
  const age =
    today.getUTCFullYear() -
    year -
    (today.getUTCMonth() + 1 < month ||
    (today.getUTCMonth() + 1 === month && today.getUTCDate() < day)
      ? 1
      : 0);
  return age >= 13;
}
