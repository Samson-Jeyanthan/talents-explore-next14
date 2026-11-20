"use server";

import { getAuthHeaders } from "@/lib/session";
import { resolveViewerIdAction } from "./tokenAndHeaders.action";
import { isRedirectError } from "next/dist/client/components/redirect";
import type { ISearchProps } from "@/types/utils.types";
import {
  searchValidation,
  normalizeExploreItems,
  optionItems,
  type SearchResult,
  type LookupKind,
  type FilterOption,
} from "@/lib/utils/explore";

async function request(path: string) {
  try {
    const headers = await getAuthHeaders();
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_BACKEND_URL}${path}`,
      { headers, cache: "no-store", signal: AbortSignal.timeout(15000) },
    );
    const data = await response.json();
    if (response.ok && data?.status === "7400")
      return { ...data, status: "7400" };
    return {
      status: response.ok ? 400 : response.status,
      message:
        typeof data?.message === "string"
          ? data.message
          : "Unable to load search results. Please try again.",
    };
  } catch (error) {
    if (isRedirectError(error)) throw error;
    return {
      status: 500,
      message: "Unable to reach search. Please try again.",
    };
  }
}

export async function searchAction(input: ISearchProps): Promise<SearchResult> {
  const parsed = searchValidation.safeParse(input);
  if (!parsed.success)
    return {
      status: 400,
      response: [],
      message: "Some search filters are invalid. Please check or clear them.",
    };
  try {
    const viewerId = await resolveViewerIdAction();
    if (!viewerId)
      return {
        status: 401,
        response: [],
        message: "Please sign in to search.",
      };
    const params = new URLSearchParams({ viewUserId: viewerId });
    if (parsed.data.searchType === "TALENT") params.set("userId", viewerId);
    for (const [key, value] of Object.entries(parsed.data)) {
      if (value !== undefined && value !== "")
        params.set(key, Array.isArray(value) ? value.join(",") : String(value));
    }
    const result = await request(`/search/?${params}`);
    const items =
      result.status === "7400" ? normalizeExploreItems(result.response) : null;
    return items
      ? { status: "7400", response: items }
      : {
          status: Number(result.status) || 500,
          response: [],
          message:
            result.message ||
            "Unable to load search results. Please try again.",
        };
  } catch (error) {
    if (isRedirectError(error)) throw error;
    return {
      status: 500,
      response: [],
      message: "Unable to load search results. Please try again.",
    };
  }
}

export async function searchPeopleTag(
  _userId: string | undefined,
  filter: string,
  pageNo: number,
  pageSize: number,
) {
  if (
    typeof filter !== "string" ||
    !Number.isSafeInteger(pageNo) ||
    pageNo < 1 ||
    !Number.isInteger(pageSize) ||
    pageSize < 1 ||
    pageSize > 100
  )
    return { status: 400, response: [], message: "Invalid user search." };
  if (!filter.trim()) return { status: "7400", response: [] };
  try {
    const viewerId = await resolveViewerIdAction();
    if (!viewerId)
      return {
        status: 401,
        response: [],
        message: "Please sign in to search.",
      };
    const params = new URLSearchParams({
      userId: viewerId,
      filter: filter.trim(),
      pageNo: String(pageNo),
      pageSize: String(pageSize),
    });
    const result = await request(`/user/tagging/search?${params}`);
    const items =
      result.status === "7400" ? normalizeExploreItems(result.response) : null;
    return items
      ? { status: "7400", response: items }
      : {
          status: Number(result.status) || 500,
          response: [],
          message:
            result.message || "Unable to search users. Please try again.",
        };
  } catch (error) {
    if (isRedirectError(error)) throw error;
    return {
      status: 500,
      response: [],
      message: "Unable to search users. Please try again.",
    };
  }
}

export async function getExploreFilterOptionsAction(
  kind: LookupKind,
  parent = "",
  shared = false,
): Promise<
  { success: true; data: FilterOption[] } | { success: false; message: string }
> {
  const kinds = [
    "categories",
    "subcategories",
    "skills",
    "languages",
    "countries",
    "states",
    "ethnic",
    "professions",
  ];
  if (
    !kinds.includes(kind) ||
    typeof parent !== "string" ||
    typeof shared !== "boolean"
  )
    return { success: false, message: "Invalid filter request." };
  if (
    (kind === "subcategories" || kind === "skills") &&
    !/^[a-f\d]{24}$/i.test(parent)
  )
    return { success: false, message: "Choose a category first." };
  if (kind === "states" && !parent.trim())
    return { success: false, message: "Choose a country first." };
  const paths = {
    categories: `/category/mainCategory${shared ? "/shared" : ""}`,
    subcategories: `/category/subCategory/${shared ? "shared/" : ""}${parent}`,
    skills: `/category/skill/${shared ? "shared/" : ""}${parent}`,
    languages: "/language",
    countries: "/country/countries",
    states: `/country/states/${encodeURIComponent(parent)}`,
    ethnic: "/private-info/ethnic",
    professions: "/private-info/professional",
  };
  const result = await request(paths[kind]);
  const rows =
    result.status === "7400"
      ? optionItems(result.response) ?? optionItems(result.data)
      : null;
  if (!rows)
    return {
      success: false,
      message:
        result.message || "Unable to load filter options. Please try again.",
    };
  const field =
    kind === "languages"
      ? "language"
      : kind === "countries"
        ? "country"
        : kind === "states"
          ? "state"
          : kind === "ethnic"
            ? "ethnic"
            : kind === "professions"
              ? "professional"
              : "name";
  const options = rows.flatMap((row: any) => {
    const label = typeof row?.[field] === "string" ? row[field].trim() : "";
    const value = kind === "countries" || kind === "states" ? label : row?._id;
    return label && typeof value === "string" ? [{ value, label }] : [];
  });
  if (rows.length && !options.length)
    return {
      success: false,
      message: "Unable to read filter options. Please try again.",
    };
  const seen = new Set<string>();
  return {
    success: true,
    data: options
      .filter((option) => {
        if (seen.has(option.value)) return false;
        seen.add(option.value);
        return true;
      })
      .sort((a, b) => a.label.localeCompare(b.label)),
  };
}
