import type { IComments } from "@/types/post.types";

export const COMMENT_PAGE_SIZE = 20;
export function mergeComments(items: IComments[]) {
  const seen = new Set<string>();
  return items.filter((item) => {
    if (seen.has(item._id)) return false;
    seen.add(item._id);
    return true;
  });
}

export function commentLikeState(
  value: any,
  viewerId?: string,
  fallback = { liked: false, count: 0 },
) {
  const flags = [
    value?.isLiked,
    value?.liked,
    value?.isLikedByUser,
    value?.likedByCurrentUser,
    value?.isCurrentUserLiked,
  ];
  const explicit = flags.find((flag) => typeof flag === "boolean");
  const liked =
    explicit ??
    (Array.isArray(value?.likes) && viewerId
      ? value.likes.some(
          (like: any) =>
            (typeof like === "string" ? like : like?._id || like?.userId) ===
            viewerId,
        )
      : fallback.liked);
  const rawCount = [
    value?.totalLikes,
    value?.likesCount,
    value?.likeCount,
    value?.noOfLikes,
  ].find((count) => typeof count === "number" && Number.isFinite(count));
  return {
    liked: Boolean(liked),
    count: Math.max(
      0,
      rawCount ??
        (Array.isArray(value?.likes) ? value.likes.length : fallback.count),
    ),
  };
}

export function canDeleteComment(
  comment: IComments,
  viewerId: string,
  postAuthorId?: string,
) {
  return (
    Boolean(viewerId) &&
    (comment.author?._id === viewerId || postAuthorId === viewerId)
  );
}

export function normalizeComment(
  value: any,
  viewerId?: string,
): IComments | null {
  if (!value || typeof value !== "object") return null;
  const record = {
    ...(value.response && typeof value.response === "object"
      ? value.response
      : {}),
    ...(value.data && typeof value.data === "object" ? value.data : {}),
    ...value,
  };
  const id = record._id || record.id || record.commentId || record.replyId;
  const text = [
    record.comment,
    record.content,
    record.text,
    record.message,
    record.reply,
  ].find((text) => typeof text === "string");
  if (typeof id !== "string" || typeof text !== "string") return null;
  const author =
    [record.author, record.user, record.member].find(
      (author) => author && typeof author === "object",
    ) || {};
  const embedded = [
    record.replies,
    record.replyComments,
    record.childComments,
    record.children,
    record.subComments,
    record.comments,
    record.reply,
  ].find(Array.isArray);
  const like = commentLikeState(record, viewerId);
  return {
    ...record,
    _id: id,
    comment: text,
    author: {
      ...author,
      _id: author._id || author.userId || "",
      userName:
        author.userName ||
        record.userName ||
        record.authorName ||
        "Unknown user",
      profileImage: author.profileImage || null,
    },
    createdAt:
      record.createdAt ||
      record.updatedAt ||
      record.time ||
      record.timestamp ||
      record.date ||
      "",
    totalReplies:
      typeof record.totalReplies === "number" &&
      Number.isFinite(record.totalReplies)
        ? Math.max(0, record.totalReplies)
        : embedded?.length || 0,
    totalLikes: like.count,
    isLiked: like.liked,
  };
}

export class CommentPages {
  private items: IComments[] = [];
  private local: IComments[] = [];
  private page = 0;
  private busy = false;
  private more = true;
  private error = "";
  private version = 0;

  snapshot() {
    return {
      items: this.items,
      page: this.page,
      loading: this.busy,
      hasMore: this.more,
      error: this.error,
    };
  }

  reset() {
    this.version++;
    this.items = [];
    this.local = [];
    this.page = 0;
    this.busy = false;
    this.more = true;
    this.error = "";
  }

  invalidate() {
    this.version++;
  }

  prepend(item: IComments) {
    this.local = mergeComments([item, ...this.local]);
    this.items = mergeComments([item, ...this.items]);
  }

  update(id: string, change: (item: IComments) => IComments) {
    this.items = this.items.map((item) =>
      item._id === id ? change(item) : item,
    );
    this.local = this.local.map((item) =>
      item._id === id ? change(item) : item,
    );
  }

  async load(
    loader: (
      page: number,
    ) => Promise<{ items?: IComments[]; message?: string }>,
  ) {
    if (this.busy || !this.more) return;
    const version = this.version;
    const page = this.page + 1;
    this.busy = true;
    this.error = "";
    try {
      const result = await loader(page);
      if (version !== this.version) return;
      if (!Array.isArray(result.items))
        throw new Error(
          result.message || "Unable to load comments. Please try again.",
        );
      this.items = mergeComments(
        page === 1
          ? [...this.local, ...result.items]
          : [...this.items, ...result.items],
      );
      this.page = page;
      this.more = result.items.length >= COMMENT_PAGE_SIZE;
    } catch (error) {
      if (version === this.version)
        this.error =
          error instanceof Error
            ? error.message
            : "Unable to load comments. Please try again.";
    } finally {
      if (version === this.version) this.busy = false;
    }
  }
}
