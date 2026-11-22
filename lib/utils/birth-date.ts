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
  const parts = /^(\d{4})-(\d{2})-(\d{2})(?:T.*)?$/.exec(value);
  if (!parts || !Number.isFinite(Date.parse(value))) return empty;
  const [, year, month, day] = parts;
  if (!convertToISOString(year, month, day)) return empty;
  return { year, month, day };
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
