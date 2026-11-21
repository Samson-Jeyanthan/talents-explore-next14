import type { IPost } from "@/types/post.types";

export const PROFILE_POST_PAGE_SIZE = 10;
export type ProfileFeedKind = "all" | "credit";
export type ProfilePostPage =
  | { status: "7400"; response: IPost[] }
  | { status: "400" | "private"; message: string };

/** Keep valid legacy IDs and absent media from breaking an entire profile tab. */
export function profilePostRows(value: unknown): IPost[] {
  if (!Array.isArray(value)) throw new Error("Invalid profile posts response.");
  return value.map((row) => {
    const id = row?._id || row?.postId;
    if (
      !row ||
      typeof id !== "string" ||
      !/^[a-f\d]{24}$/i.test(id) ||
      typeof row.author?._id !== "string" ||
      typeof row.about?.title !== "string" ||
      (row.media != null && !Array.isArray(row.media))
    )
      throw new Error("Invalid profile post.");
    for (const name of [
      "description",
      "country",
      "state",
      "mainCategory",
      "skill",
    ]) {
      if (row.about[name] != null && typeof row.about[name] !== "string")
        throw new Error("Invalid profile post details.");
    }
    return {
      ...row,
      _id: id,
      media: row.media || [],
      postRating: Number.isFinite(Number(row.postRating))
        ? Number(row.postRating)
        : 0,
    } as IPost;
  });
}

export function profilePostThumbnail(post: {
  media?: { mediaType?: string; url?: string; thumbnailUrl?: string }[] | null;
  website?: unknown;
  shareLinkThumbnail?: unknown;
}) {
  const first = post.media?.[0];
  const selected =
    post.website && post.shareLinkThumbnail
      ? post.shareLinkThumbnail
      : first?.mediaType === "image"
        ? first.url
        : first?.thumbnailUrl;
  return typeof selected === "string" && /^https?:\/\//i.test(selected)
    ? selected
    : "/assets/images/sample-post-img.jpg";
}
