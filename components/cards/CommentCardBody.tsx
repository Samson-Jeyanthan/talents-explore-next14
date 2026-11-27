"use client";
import LinkedText from "@/components/others/LinkedText";

import Link from "next/link";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { CornerDownRight, Heart, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import UserProfileImg from "../others/UserProfileImg";
import { useUserContext } from "@/context/AuthProvider";
import { commentLikeAction } from "@/actions/comment.action";
import { canDeleteComment, commentLikeState } from "@/lib/utils/commentPages";
import type { IComments } from "@/types/post.types";

export default function CommentCardBody({
  commentDetails: comment,
  canReply,
  onReply,
  isReply,
  repliesOpen,
  onToggleReplies,
  postAuthorId,
  onDelete,
  inlineReply,
}: {
  commentDetails: IComments;
  canReply?: boolean;
  onReply?: () => void;
  isReply?: boolean;
  repliesOpen?: boolean;
  onToggleReplies?: () => void;
  postAuthorId?: string;
  onDelete?: () => void;
  inlineReply?: ReactNode;
}) {
  const { user } = useUserContext();
  const [liked, setLiked] = useState(comment.isLiked);
  const [likes, setLikes] = useState(comment.totalLikes);
  const [busy, setBusy] = useState(false);
  const inFlight = useRef(false);
  useEffect(() => {
    setLiked(comment.isLiked);
    setLikes(comment.totalLikes);
  }, [comment.isLiked, comment.totalLikes]);
  async function like() {
    if (inFlight.current) return;
    inFlight.current = true;
    setBusy(true);
    try {
      const result = await commentLikeAction(comment._id);
      if (result?.status !== "7400") {
        toast.error(result?.message || "Unable to update this like.");
        return;
      }
      const next = commentLikeState(result.response, user.currentUserId, {
        liked: !liked,
        count: Math.max(0, likes + (liked ? -1 : 1)),
      });
      setLiked(next.liked);
      setLikes(next.count);
    } catch {
      toast.error("Unable to update this like. Please try again.");
    } finally {
      inFlight.current = false;
      setBusy(false);
    }
  }
  const profile = comment.author?._id
    ? `/profile/${comment.author.userName || "user"}/${comment.author._id}`
    : "#";
  const date =
    comment.createdAt && !Number.isNaN(new Date(comment.createdAt).getTime())
      ? format(new Date(comment.createdAt), "d MMM · hh:mm a")
      : "";
  const deletable =
    Boolean(onDelete) &&
    canDeleteComment(comment, user.currentUserId, postAuthorId);
  return (
    <div
      className="flex min-w-0 gap-3"
      data-comment-kind={isReply ? "reply" : "comment"}
    >
      <Link
        href={profile}
        aria-label={`View ${comment.author?.userName || "user"} profile`}
      >
        <UserProfileImg
          userName={comment.author?.userName || "Unknown user"}
          src={comment.author?.profileImage}
          className={
            isReply
              ? "size-7 min-h-7 min-w-7 rounded-full"
              : "size-10 min-h-10 min-w-10 rounded-full"
          }
        />
      </Link>
      <div className="min-w-0 flex-1">
        <div className="mb-2 flex flex-wrap items-center gap-x-2 gap-y-1">
          <Link
            href={profile}
            className={`break-all font-semibold text-light-900 ${isReply ? "text-xs" : "text-sm"}`}
          >
            @{comment.author?.userName || "Unknown user"}
          </Link>
          {isReply && (
            <span className="flex items-center gap-1 rounded-full bg-primary-500/5 px-2 py-0.5 text-[10px] font-medium text-primary-500 dark:text-red-300">
              <CornerDownRight className="size-3" aria-hidden="true" />
              Reply
            </span>
          )}
          {date && (
            <time
              dateTime={new Date(comment.createdAt).toISOString()}
              className="ml-auto text-[11px] text-light-500"
            >
              {date}
            </time>
          )}
          {deletable && (
            <button
              type="button"
              aria-label={isReply ? "Delete reply" : "Delete comment"}
              onClick={onDelete}
              className="rounded-lg p-2 text-light-500 hover:bg-red-500/10 hover:text-red-500"
            >
              <Trash2 className="size-4" />
            </button>
          )}
        </div>
        <p
          className={
            isReply
              ? "whitespace-pre-wrap break-words rounded-xl rounded-tl-sm border border-[#ECEEF7] bg-[#FBFBFE] px-3 py-2 text-[13px] leading-6 text-light-900 dark:border-dark-400 dark:bg-dark-200"
              : "whitespace-pre-wrap break-words rounded-2xl rounded-tl-sm border border-[#ECEEF7] bg-[#F7F8FC] px-4 py-3 text-sm leading-6 text-light-900 dark:border-dark-400 dark:bg-dark-300"
          }
        >
          <LinkedText text={comment.comment} />
        </p>
        <div className="mt-2 flex flex-wrap items-center gap-4 text-xs text-light-600">
          {canReply && (
            <button
              type="button"
              onClick={onReply}
              aria-label={`Reply to ${comment.author?.userName || "user"}`}
              className="py-1 font-medium text-light-900 hover:text-primary-500"
            >
              Reply
            </button>
          )}
          <button
            type="button"
            disabled={busy}
            aria-label={liked ? "Unlike comment" : "Like comment"}
            aria-pressed={liked}
            onClick={like}
            className={`flex items-center gap-1.5 rounded py-1 ${liked ? "text-primary-500" : "text-light-500"}`}
          >
            <Heart className={`size-3.5 ${liked ? "fill-primary-500" : ""}`} />
            <span>{likes}</span>
            <span className="sr-only">likes</span>
          </button>
          {onToggleReplies && (comment.totalReplies > 0 || repliesOpen) && (
            <button
              type="button"
              onClick={onToggleReplies}
              aria-expanded={Boolean(repliesOpen)}
              className="ml-auto py-1 font-medium text-light-900 hover:text-primary-500"
            >
              {repliesOpen
                ? "Hide replies"
                : `View replies (${comment.totalReplies})`}
            </button>
          )}
        </div>
        {inlineReply && (
          <div className="mt-3 rounded-xl border border-dark-400 bg-dark-250 p-3">
            {inlineReply}
          </div>
        )}
      </div>
    </div>
  );
}
