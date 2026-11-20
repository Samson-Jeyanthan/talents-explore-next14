import { z } from "zod";

const id = z.string().regex(/^[a-f\d]{24}$/i);
const text = z.string().trim().optional();
const rating = z.number().finite().min(0).max(5).optional();
export const searchValidation = z.object({
  searchType: z.enum(["ALL", "FEED", "SHARE", "TALENT", "CREDITS"]),
  pageNo: z.number().int().positive(),
  pageSize: z.number().int().min(1).max(100),
  searchText: text,
  mainCategoryId: id.optional(),
  subCategoryId: id.optional(),
  skillId: id.optional(),
  level: z.enum(["beginner", "intermediate", "advanced"]).optional(),
  primaryLanguage: id.optional(),
  secondaryLanguage: id.optional(),
  publicRating: rating,
  privateRating: rating,
  userRating: rating,
  keywords: z.array(z.string().trim()).optional(),
  description: text,
  country: text,
  state: text,
  creditTitle: text,
  creditPeopleTag: text,
  resultTime: z
    .enum(["one month", "six month", "one year", "two year"])
    .optional(),
  userGender: z.enum(["male", "female", "other", "prefferNotToSay"]).optional(),
  ethnic: id.optional(),
  userLanguage: id.optional(),
});
export type SearchQuery = z.infer<typeof searchValidation>;
export type ExploreType = "ALL" | "FEED" | "SHARE" | "TALENT";
export type ExploreItem = { _id: string; [key: string]: any };
export type SearchResult =
  | { status: "7400"; response: ExploreItem[] }
  | { status: number; response: []; message: string };
export const EXPLORE_PAGE_SIZE = 20;
export const filterFields = [
  "mainCategory",
  "subCategory",
  "skill",
  "level",
  "keywords",
  "postDescription",
  "primaryLanguage",
  "secondaryLanguage",
  "publicRating",
  "privateRating",
  "timeDuration",
  "country",
  "state",
  "creditTitle",
  "creditPeopleTag",
  "profileRating",
  "gender",
  "userEthnicity",
  "userLanguage",
] as const;
export type FilterField = (typeof filterFields)[number];
const aliases: Partial<Record<FilterField, string>> = {
  mainCategory: "mainCategoryId",
  subCategory: "subCategoryId",
  skill: "skillId",
  postDescription: "description",
  timeDuration: "resultTime",
  profileRating: "userRating",
  gender: "userGender",
  userEthnicity: "ethnic",
};
export function getExploreFilterValues(query: string) {
  const params = new URLSearchParams(query);
  return Object.fromEntries(
    filterFields.map((key) => [
      key,
      params.get(key) ??
        (aliases[key] ? params.get(aliases[key]!) : null) ??
        "",
    ]),
  ) as Record<FilterField, string>;
}
export function replaceExploreFilters(
  query: string,
  values: Record<FilterField, string>,
) {
  const params = new URLSearchParams(query);
  for (const key of filterFields) {
    if (aliases[key]) params.delete(aliases[key]!);
    const value = values[key].trim();
    if (value && !(key.endsWith("Rating") && Number(value) === 0))
      params.set(key, value);
    else params.delete(key);
  }
  params.delete("page");
  params.delete("pageNo");
  return params.toString();
}
export function clearExploreFilters(query: string) {
  return replaceExploreFilters(query, getExploreFilterValues(""));
}
export function exploreTabHref(href: string, query: string) {
  const params = new URLSearchParams(query);
  params.delete("page");
  params.delete("pageNo");
  return `${href}${params.size ? `?${params}` : ""}`;
}
export function paramsString(
  params: Record<string, string | string[] | undefined>,
) {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params))
    if (typeof value === "string") query.set(key, value);
  return query.toString();
}
export function buildExploreQuery(
  type: ExploreType,
  query: string,
): SearchQuery {
  const params = new URLSearchParams(query);
  const values = getExploreFilterValues(query);
  const number = (value: string) => (value.trim() ? Number(value) : undefined);
  const optional = (value: string) => value.trim() || undefined;
  return searchValidation.parse({
    searchType: type,
    pageNo: 1,
    pageSize: EXPLORE_PAGE_SIZE,
    searchText: optional(params.get("q") || ""),
    mainCategoryId: optional(values.mainCategory),
    subCategoryId: optional(values.subCategory),
    skillId: optional(values.skill),
    level: optional(values.level),
    keywords: values.keywords
      ? values.keywords
          .split(",")
          .map((word) => word.trim())
          .filter(Boolean)
      : undefined,
    description: optional(values.postDescription),
    country: optional(values.country),
    state: optional(values.state),
    creditTitle: optional(values.creditTitle),
    creditPeopleTag: optional(values.creditPeopleTag),
    ...(type === "TALENT"
      ? {
          userRating: number(values.profileRating),
          userGender: optional(values.gender),
          ethnic: optional(values.userEthnicity),
          userLanguage: optional(values.userLanguage),
        }
      : {
          primaryLanguage: optional(values.primaryLanguage),
          secondaryLanguage: optional(values.secondaryLanguage),
          publicRating: number(values.publicRating),
          privateRating: number(values.privateRating),
          resultTime: optional(values.timeDuration),
        }),
  });
}
export function normalizeExploreItems(value: unknown): ExploreItem[] | null {
  return Array.isArray(value) &&
    value.every(
      (item) =>
        item && typeof item._id === "string" && /^[a-f\d]{24}$/i.test(item._id),
    )
    ? value
    : null;
}
export function exploreThumbnail(item: ExploreItem) {
  const media = Array.isArray(item.media) ? item.media[0] : item.media;
  const shared = item.shareLinkThumbnail;
  const candidates = [
    media?.mediaType === "image" ? media.url : media?.thumbnailUrl,
    typeof shared === "string" ? shared : shared?.url || shared?.thumbnailUrl,
  ];
  return (
    candidates.find(
      (url) => typeof url === "string" && /^(https?:\/\/|\/)/i.test(url),
    ) || "/assets/images/default-save-folder.png"
  );
}
export function optionItems(value: unknown, depth = 0): any[] | null {
  if (Array.isArray(value)) return value;
  if (value && typeof value === "object" && depth < 4)
    for (const key of ["response", "data", "list", "results", "items"]) {
      const items = optionItems((value as any)[key], depth + 1);
      if (items) return items;
    }
  return null;
}
export type LookupKind =
  | "categories"
  | "subcategories"
  | "skills"
  | "languages"
  | "countries"
  | "states"
  | "ethnic"
  | "professions";
export type FilterOption = { value: string; label: string };
