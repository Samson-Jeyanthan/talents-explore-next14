import type { ISavedFolder } from "@/types/post.types";

export const isCollectionId = (value: unknown): value is string =>
  typeof value === "string" && /^[a-f\d]{24}$/i.test(value);
export function collectionName(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}
export function normalizeSavedFolders(value: unknown): ISavedFolder[] | null {
  if (
    !Array.isArray(value) ||
    value.some(
      (item) =>
        !item ||
        !isCollectionId(item._id) ||
        typeof item.collectionName !== "string",
    )
  )
    return null;
  const seen = new Set<string>();
  return value
    .filter((item) => {
      if (seen.has(item._id)) return false;
      seen.add(item._id);
      return true;
    })
    .map((item) => ({
      ...item,
      collectionName: item.collectionName.trim() || "Untitled collection",
      status:
        item.status === true ||
        item.status === 1 ||
        item.status === "1" ||
        item.status === "true",
    }));
}
