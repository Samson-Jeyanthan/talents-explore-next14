import type { ILanguage, ITopPost } from "@/types/profile.types";

export type ProfileSectionResult<T> =
  | { status: "7400"; response: T[] }
  | { status: "400" | "private"; response: []; message: string };

export function profileSectionResult<T>(
  value: unknown,
  fallback: string,
): ProfileSectionResult<T> {
  if (value && typeof value === "object") {
    const result = value as {
      status?: unknown;
      response?: unknown;
      message?: unknown;
    };
    if (result.status === "7400" && Array.isArray(result.response))
      return { status: "7400", response: result.response as T[] };
    if (result.status === "private")
      return {
        status: "private",
        response: [],
        message: typeof result.message === "string" ? result.message : fallback,
      };
    if (typeof result.message === "string" && result.message.trim())
      return { status: "400", response: [], message: result.message };
  }
  return { status: "400", response: [], message: fallback };
}

export function profileTopPostRows(value: unknown): ITopPost[] {
  if (!Array.isArray(value)) throw new Error("Invalid top posts response.");
  const ids = new Set<string>();
  return value
    .map((row) => {
      const id = row?._id || row?.postId;
      if (
        !row ||
        typeof id !== "string" ||
        !/^[a-f\d]{24}$/i.test(id) ||
        typeof row.about?.title !== "string" ||
        (row.media != null && !Array.isArray(row.media))
      )
        throw new Error("Invalid top post.");
      return {
        ...row,
        _id: id,
        media: row.media || [],
        postRating: Number.isFinite(Number(row.postRating))
          ? Number(row.postRating)
          : 0,
      } as ITopPost;
    })
    .filter((row) => {
      if (ids.has(row._id)) return false;
      ids.add(row._id);
      return true;
    });
}

export function profileLanguageRows(value: unknown): ILanguage[] {
  if (!Array.isArray(value)) throw new Error("Invalid languages response.");
  const ids = new Set<string>();
  return value.map((row) => {
    if (
      !row ||
      typeof row._id !== "string" ||
      !row._id ||
      typeof row.languageId !== "string" ||
      !row.languageId ||
      typeof row.languageName !== "string" ||
      typeof row.level !== "string" ||
      ids.has(row._id)
    )
      throw new Error("Invalid language detail.");
    ids.add(row._id);
    return { ...row } as ILanguage;
  });
}
