export interface RatingUser {
  _id: string;
  rating: number;
  userName: string;
  firstName: string;
  lastName: string;
  profileImage: string;
  professional: string;
}
export interface RatingSummary {
  avgRating: number;
  numberOfRating: number;
  oneStar: number;
  twoStar: number;
  threeStar: number;
  fourStar: number;
  fiveStar: number;
}
export type RatingResult<T> =
  | { status: "7400"; response: T }
  | { status: number; message: string; restricted?: boolean };
export function validRating(value: unknown): value is number {
  return (
    typeof value === "number" &&
    Number.isInteger(value) &&
    value >= 1 &&
    value <= 5
  );
}
export function displayRating(value: unknown) {
  const number =
    typeof value === "number"
      ? value
      : typeof value === "string" && value.trim()
        ? Number(value)
        : 0;
  return Number.isFinite(number) ? Math.max(0, Math.min(5, number)) : 0;
}
export function ratingPercentage(count: number, total: number) {
  return Number.isFinite(count) && Number.isFinite(total) && total > 0
    ? Math.max(0, Math.min(100, (count / total) * 100))
    : 0;
}
export function normalizeRatingSummary(value: any): RatingSummary | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const keys = [
    "oneStar",
    "twoStar",
    "threeStar",
    "fourStar",
    "fiveStar",
  ] as const;
  const counts = Object.fromEntries(
    keys.map((key) => [key, Number(value[key] ?? 0)]),
  ) as Pick<RatingSummary, (typeof keys)[number]>;
  const total = Number(
    value.numberOfRating ?? keys.reduce((sum, key) => sum + counts[key], 0),
  );
  const average = Number(value.avgRating ?? 0);
  if (
    !keys.every(
      (key) => Number.isSafeInteger(counts[key]) && counts[key] >= 0,
    ) ||
    !Number.isSafeInteger(total) ||
    total < 0 ||
    !Number.isFinite(average) ||
    average < 0 ||
    average > 5
  )
    return null;
  return { ...counts, numberOfRating: total, avgRating: average };
}
export function normalizeRatingUsers(value: any): RatingUser[] | null {
  if (
    !Array.isArray(value) ||
    value.some(
      (item) =>
        !item ||
        typeof item._id !== "string" ||
        !/^[a-f\d]{24}$/i.test(item._id) ||
        !Number.isFinite(Number(item.rating)) ||
        Number(item.rating) < 0 ||
        Number(item.rating) > 5,
    )
  )
    return null;
  const text = (value: unknown) => (typeof value === "string" ? value : "");
  return value.map((item) => ({
    _id: item._id,
    rating: Number(item.rating),
    userName: text(item.userName) || "user",
    firstName: text(item.firstName) || text(item.userName),
    lastName: text(item.lastName),
    profileImage: text(item.profileImage),
    professional:
      text(item.professional) || text(item.professional?.professional),
  }));
}
export function ratingBreakdown(summary: RatingSummary) {
  return (
    ["fiveStar", "fourStar", "threeStar", "twoStar", "oneStar"] as const
  ).map((key, index) => ({
    no: 5 - index,
    value: summary[key],
    percentage: ratingPercentage(summary[key], summary.numberOfRating),
  }));
}
